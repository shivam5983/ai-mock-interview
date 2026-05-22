import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { submitAnswer } from "../api";
import ChatMessage from "../components/ChatMessage";
import TypingIndicator from "../components/TypingIndicator";
import CircularTimer from "../components/CircularTimer";
import VoiceButton from "../components/VoiceButton";
import ScoreBreakdown from "../components/ScoreBreakdown";

const QUESTION_TIME = 60;
const READY_TIME = 3;

let msgIdCounter = 0;
function msg(role, content, extra = {}) {
  msgIdCounter++;
  return { id: msgIdCounter, role, content, timestamp: new Date(), ...extra };
}

export default function Interview() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Guard: if no state, go home
  if (!state || !state.questions || state.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-[#8b949e]">No interview data found.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  const { questions, jobRole = "" } = state;

  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [phase, setPhase] = useState("init"); // init | ready | answering | evaluating | between | done
  const [timerSeconds, setTimerSeconds] = useState(QUESTION_TIME);
  const [readyCountdown, setReadyCountdown] = useState(READY_TIME);
  const [isTyping, setIsTyping] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [expandedScores, setExpandedScores] = useState({});

  const timerRef = useRef(null);
  const readyRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const answerRef = useRef("");
  const resultsRef = useRef([]);
  const submittingRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Start on mount
  useEffect(() => {
    const t1 = setTimeout(() => {
      setMessages([
        msg(
          "ai",
          `👋 Welcome to your **${jobRole}** interview! I'll ask you 5 questions. Take your time and answer clearly. Let's begin!`,
        ),
      ]);
      const t2 = setTimeout(() => startReadyCountdown(0), 1200);
      return () => clearTimeout(t2);
    }, 400);
    return () => clearTimeout(t1);
  }, []);

  function addMsg(role, content, extra = {}) {
    setMessages((prev) => [...prev, msg(role, content, extra)]);
  }

  function startReadyCountdown(qIndex) {
    setPhase("between");
    setReadyCountdown(READY_TIME);
    let count = READY_TIME;
    clearInterval(readyRef.current);
    readyRef.current = setInterval(() => {
      count--;
      setReadyCountdown(count);
      if (count <= 0) {
        clearInterval(readyRef.current);
        showQuestion(qIndex);
      }
    }, 1000);
  }

  function showQuestion(qIndex) {
    setCurrentIndex(qIndex);
    currentIndexRef.current = qIndex;
    setPhase("answering");
    setAnswer("");
    answerRef.current = "";
    autoSubmittedRef.current = false;
    submittingRef.current = false;
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      addMsg(
        "ai",
        `**Question ${qIndex + 1} of ${questions.length}:**\n\n${questions[qIndex]}`,
      );
      startTimer();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 700);
  }

  function startTimer() {
    clearInterval(timerRef.current);
    setTimerSeconds(QUESTION_TIME);
    let secs = QUESTION_TIME;
    timerRef.current = setInterval(() => {
      secs--;
      setTimerSeconds(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        if (!autoSubmittedRef.current && !submittingRef.current) {
          autoSubmittedRef.current = true;
          // Use refs to avoid stale closures
          doSubmit(
            answerRef.current,
            currentIndexRef.current,
            resultsRef.current,
            true,
          );
        }
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  // Core submit logic — uses passed-in values to avoid stale state
  async function doSubmit(currentAnswer, qIndex, currentResults, isAuto) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    stopTimer();

    const trimmed = currentAnswer.trim();

    if (!isAuto && trimmed.length < 3) {
      setError("Please write at least a brief answer.");
      submittingRef.current = false;
      return;
    }

    setError("");

    if (trimmed) {
      addMsg("user", trimmed);
    }

    if (isAuto && !trimmed) {
      addMsg("ai", "⏰ Time's up! No answer was provided.", {
        isTimesUp: true,
      });
    }

    setPhase("evaluating");
    setAnswer("");
    answerRef.current = "";
    setIsTyping(true);

    try {
      const res = await submitAnswer(
        questions[qIndex],
        trimmed,
        jobRole,
        isAuto && !trimmed,
      );

      const newResult = {
        question: questions[qIndex],
        answer: trimmed || "(No answer provided)",
        feedback: res.data.feedback,
        score: res.data.score,
        detailedScores: res.data.detailed_scores,
        tips: res.data.improvement_tips || [],
      };

      const updatedResults = [...currentResults, newResult];
      setResults(updatedResults);
      resultsRef.current = updatedResults;

      setIsTyping(false);

      const scoreEmoji =
        res.data.score >= 8 ? "🌟" : res.data.score >= 6 ? "✅" : "💪";
      const newMsgId = msgIdCounter + 1;
      addMsg(
        "ai",
        `${scoreEmoji} **Score: ${res.data.score}/10**\n\n${res.data.feedback}`,
        {
          detailedScores: res.data.detailed_scores,
          tips: res.data.improvement_tips,
          msgId: newMsgId,
        },
      );

      if (qIndex + 1 >= questions.length) {
        // Interview done
        setPhase("done");
        setTimeout(() => {
          addMsg("ai", "🎉 Interview complete! Taking you to your results...");
          setTimeout(() => {
            navigate("/results", {
              state: { results: updatedResults, jobRole },
            });
          }, 1800);
        }, 800);
      } else {
        // Next question
        setTimeout(() => {
          startReadyCountdown(qIndex + 1);
        }, 1400);
      }
    } catch (err) {
      setIsTyping(false);
      setPhase("answering");
      submittingRef.current = false;
      setError(
        err.response?.data?.detail || "Failed to evaluate. Please try again.",
      );
      // Restart timer with remaining time
      startTimer();
    }
  }

  // Button submit handler
  const handleSubmit = useCallback(() => {
    if (phase !== "answering" || submittingRef.current) return;
    doSubmit(
      answerRef.current,
      currentIndexRef.current,
      resultsRef.current,
      false,
    );
  }, [phase]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(readyRef.current);
    };
  }, []);

  const progress =
    questions.length > 0
      ? (Math.max(0, currentIndex) / questions.length) * 100
      : 0;

  const canSubmit =
    phase === "answering" &&
    answer.trim().length >= 1 &&
    !submittingRef.current;

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#0d1117]">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-[#21262d] flex items-center justify-between bg-[#0d1117] z-10">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">◆</span>
          <span className="font-display font-bold text-white hidden sm:block">
            InterviewAI
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="tag hidden sm:inline">{jobRole}</span>
          {currentIndex >= 0 && (
            <span className="text-xs text-[#8b949e]">
              Q{Math.min(currentIndex + 1, questions.length)}/{questions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {phase === "answering" && (
            <CircularTimer seconds={timerSeconds} total={QUESTION_TIME} />
          )}
          {phase === "between" && (
            <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-1.5">
              <span className="text-amber-400 text-xs font-medium">
                Get Ready
              </span>
              <span className="font-mono font-bold text-amber-400">
                {readyCountdown}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-0.5 bg-[#21262d]">
        <div
          className="h-full bg-amber-400 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id}>
            <ChatMessage message={m} />
            {m.detailedScores && (
              <div className="ml-10 mt-1">
                <button
                  onClick={() =>
                    setExpandedScores((prev) => ({
                      ...prev,
                      [m.id]: !prev[m.id],
                    }))
                  }
                  className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  {expandedScores[m.id]
                    ? "▲ Hide breakdown"
                    : "▼ Show score breakdown"}
                </button>
                {expandedScores[m.id] && (
                  <div className="mt-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 animate-fade-in">
                    <ScoreBreakdown
                      detailedScores={m.detailedScores}
                      tips={m.tips}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#21262d] bg-[#0d1117] px-4 py-3">
        {error && (
          <div className="mb-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <VoiceButton
            disabled={phase !== "answering"}
            onTranscript={(text) => {
              setAnswer((prev) => {
                const updated = prev ? prev + " " + text : text;
                answerRef.current = updated;
                return updated;
              });
            }}
          />

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="input-field resize-none text-sm leading-relaxed"
              rows={3}
              placeholder={
                phase === "answering"
                  ? "Type your answer, or use the mic..."
                  : phase === "between"
                    ? `Next question in ${readyCountdown}s...`
                    : phase === "evaluating"
                      ? "AI is evaluating your answer..."
                      : phase === "done"
                        ? "Interview complete!"
                        : "Preparing interview..."
              }
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                answerRef.current = e.target.value;
              }}
              disabled={phase !== "answering"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey && canSubmit) handleSubmit();
              }}
            />
            <div className="flex justify-between items-center mt-1 px-0.5">
              <span className="text-[10px] text-[#484f58]">
                {answer.length} chars · Ctrl+Enter to submit
              </span>
              {phase === "answering" && (
                <span
                  className={`text-[10px] font-mono font-medium ${
                    timerSeconds <= 10
                      ? "text-red-400"
                      : timerSeconds <= 20
                        ? "text-amber-400"
                        : "text-[#484f58]"
                  }`}
                >
                  {timerSeconds}s remaining
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-11 h-11 rounded-xl bg-amber-400 text-[#0d1117] flex items-center justify-center
                       hover:bg-amber-300 active:scale-95 transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 flex-shrink-0"
            title="Submit answer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
