from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from groq import Groq
import sqlite3
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Mock Interviewer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

DB_PATH = "interviews.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_role TEXT NOT NULL,
            questions TEXT NOT NULL,
            answers TEXT NOT NULL,
            feedbacks TEXT NOT NULL,
            scores TEXT NOT NULL,
            detailed_scores TEXT NOT NULL DEFAULT '[]',
            total_score REAL NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    # Add detailed_scores column if it doesn't exist (migration)
    try:
        c.execute("ALTER TABLE sessions ADD COLUMN detailed_scores TEXT NOT NULL DEFAULT '[]'")
    except Exception:
        pass
    conn.commit()
    conn.close()


init_db()


class StartInterviewRequest(BaseModel):
    job_role: str


class SubmitAnswerRequest(BaseModel):
    question: str
    answer: str
    job_role: Optional[str] = ""
    auto_submitted: Optional[bool] = False


class SaveSessionRequest(BaseModel):
    job_role: str
    questions: list[str]
    answers: list[str]
    feedbacks: list[str]
    scores: list[float]
    detailed_scores: Optional[list[dict]] = []


def call_groq(prompt: str, max_tokens: int = 1000) -> str:
    message = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
    return message.choices[0].message.content.strip()


@app.post("/start-interview")
async def start_interview(req: StartInterviewRequest):
    if not req.job_role.strip():
        raise HTTPException(status_code=400, detail="job_role is required")

    prompt = f"""You are an expert technical interviewer. Generate exactly 5 interview questions for a {req.job_role} position.

Requirements:
- Mix of behavioral, technical, and situational questions
- Questions should be relevant to the {req.job_role} role
- Each question should be clear and concise
- Questions should assess different competencies

Return ONLY a JSON array of 5 question strings, nothing else. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    try:
        response_text = call_groq(prompt)

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]).strip()

        questions = json.loads(response_text)

        if not isinstance(questions, list) or len(questions) != 5:
            raise HTTPException(status_code=500, detail="Failed to generate 5 questions")

        return {"questions": questions, "job_role": req.job_role}

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse questions from AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@app.post("/submit-answer")
async def submit_answer(req: SubmitAnswerRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    answer_text = req.answer.strip() if req.answer.strip() else "[No answer provided - time ran out]"
    auto_note = " Note: The candidate ran out of time and did not provide an answer." if req.auto_submitted else ""

    prompt = f"""You are an expert interviewer evaluating a candidate's response for a {req.job_role or "General"} role.{auto_note}

Interview Question: {req.question}
Candidate's Answer: {answer_text}

Evaluate the answer across 4 dimensions and provide improvement tips.

Return ONLY a JSON object in this exact format (no extra text):
{{
  "feedback": "Overall constructive feedback in 2-3 sentences",
  "technical_knowledge": 7,
  "communication_clarity": 6,
  "confidence_level": 8,
  "overall_score": 7,
  "improvement_tips": ["Tip 1 for weakest area", "Tip 2 for improvement", "Tip 3 actionable advice"]
}}

Scoring guide (1-10):
- technical_knowledge: Accuracy, depth, and relevance of technical content
- communication_clarity: How clearly and structurally the answer was presented
- confidence_level: Assertiveness, conviction, and completeness of the answer
- overall_score: Holistic assessment of the entire response

Be fair, specific, and encouraging. If no answer was given, score all categories 1-2."""

    try:
        response_text = call_groq(prompt, max_tokens=600)

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]).strip()

        result = json.loads(response_text)

        return {
            "feedback": result.get("feedback", "No feedback available"),
            "score": result.get("overall_score", 5),
            "detailed_scores": {
                "technical_knowledge": result.get("technical_knowledge", 5),
                "communication_clarity": result.get("communication_clarity", 5),
                "confidence_level": result.get("confidence_level", 5),
                "overall_score": result.get("overall_score", 5),
            },
            "improvement_tips": result.get("improvement_tips", []),
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse feedback from AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@app.post("/save-session")
async def save_session(req: SaveSessionRequest):
    total_score = sum(req.scores) / len(req.scores) if req.scores else 0

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO sessions (job_role, questions, answers, feedbacks, scores, detailed_scores, total_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            req.job_role,
            json.dumps(req.questions),
            json.dumps(req.answers),
            json.dumps(req.feedbacks),
            json.dumps(req.scores),
            json.dumps(req.detailed_scores or []),
            round(total_score, 1),
            datetime.now().isoformat(),
        ),
    )
    conn.commit()
    session_id = c.lastrowid
    conn.close()

    return {"message": "Session saved", "session_id": session_id}


@app.get("/session-history")
async def session_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "SELECT id, job_role, questions, answers, feedbacks, scores, detailed_scores, total_score, created_at FROM sessions ORDER BY created_at DESC LIMIT 20"
    )
    rows = c.fetchall()
    conn.close()

    sessions = []
    for row in rows:
        sessions.append({
            "id": row[0],
            "job_role": row[1],
            "questions": json.loads(row[2]),
            "answers": json.loads(row[3]),
            "feedbacks": json.loads(row[4]),
            "scores": json.loads(row[5]),
            "detailed_scores": json.loads(row[6]) if row[6] else [],
            "total_score": row[7],
            "created_at": row[8],
        })

    return {"sessions": sessions}


@app.get("/health")
async def health():
    return {"status": "ok"}
