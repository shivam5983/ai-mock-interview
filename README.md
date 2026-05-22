# AI Mock Interviewer

A full-stack AI-powered mock interview application built with FastAPI + React. Practice interviews for any role and get instant AI feedback and scores.

## Tech Stack

**Backend:** Python, FastAPI, Anthropic Claude API, SQLite  
**Frontend:** React, Vite, Tailwind CSS, Axios, React Router

---

## Project Structure

```
ai-mock-interviewer/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   └── interviews.db        # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Role selection + start
│   │   │   ├── Interview.jsx # Q&A flow
│   │   │   ├── Results.jsx  # Scores + feedback
│   │   │   └── History.jsx  # Past sessions
│   │   ├── api.js           # Axios API calls
│   │   ├── App.jsx          # Router
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))

---

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set up environment variables
cp .env.example .env
# Edit .env and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-...

# 6. Start the server
uvicorn main:app --reload --port 8000
```

The API will be running at `http://localhost:8000`  
API docs available at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Navigate to frontend folder (in a new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will be running at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/start-interview` | Generate 5 questions for a job role |
| `POST` | `/submit-answer` | Evaluate an answer, return feedback + score |
| `POST` | `/save-session` | Save completed session to SQLite |
| `GET` | `/session-history` | Retrieve past interview sessions |
| `GET` | `/health` | Health check |

### Example Requests

**Start Interview:**
```json
POST /start-interview
{
  "job_role": "Software Engineer"
}
```

**Submit Answer:**
```json
POST /submit-answer
{
  "question": "Tell me about a challenging project you worked on.",
  "answer": "In my last role, I led the migration of...",
  "job_role": "Software Engineer"
}
```

---

## Features

- 🤖 AI-generated questions tailored to any job role
- 📝 Instant feedback on every answer
- 🎯 Score out of 10 per question + overall score
- 📊 Session history stored in SQLite
- 🎨 Clean dark UI with animated transitions
- 📱 Responsive design

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

---

## Building for Production

**Backend:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
npm run build
# Output in dist/ folder - serve with any static file server
```
