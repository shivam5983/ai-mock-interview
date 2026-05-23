import { useState, useRef, useEffect, useCallback } from "react";

export default function VoiceButton({ onTranscript, disabled }) {
  const [status, setStatus] = useState("idle");
  const [liveText, setLiveText] = useState("");
  const isListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");
  const recognitionRef = useRef(null);

  const createRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false; // false is more stable on Chrome localhost
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setStatus("listening");
    };

    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        fullTranscriptRef.current += " " + final;
        setLiveText(fullTranscriptRef.current.trim());
      } else if (interim) {
        setLiveText((fullTranscriptRef.current + " " + interim).trim());
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        alert(
          "Microphone blocked! Go to Chrome address bar → click lock icon → allow Microphone → refresh page.",
        );
        isListeningRef.current = false;
        setStatus("idle");
        return;
      }
      // On any other error, restart if still supposed to listen
      if (isListeningRef.current) {
        setTimeout(() => restartRecognition(), 100);
      }
    };

    rec.onend = () => {
      // KEY: restart automatically until user clicks stop
      if (isListeningRef.current) {
        setTimeout(() => restartRecognition(), 100);
      } else {
        // User clicked stop — send full transcript
        const text = fullTranscriptRef.current.trim();
        if (text) {
          setStatus("processing");
          setLiveText("");
          setTimeout(() => {
            onTranscript(text);
            setStatus("idle");
          }, 300);
        } else {
          setStatus("idle");
          setLiveText("");
        }
      }
    };

    return rec;
  }, [onTranscript]);

  const restartRecognition = useCallback(() => {
    if (!isListeningRef.current) return;
    try {
      const rec = createRecognition();
      if (!rec) return;
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Restart error:", e);
    }
  }, [createRecognition]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setStatus("unsupported");
    return () => {
      isListeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
    };
  }, []);

  const startListening = () => {
    fullTranscriptRef.current = "";
    setLiveText("");
    isListeningRef.current = true;
    const rec = createRecognition();
    if (!rec) {
      setStatus("unsupported");
      return;
    }
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error("Start error:", e);
      isListeningRef.current = false;
    }
  };

  const stopListening = () => {
    isListeningRef.current = false; // Must set BEFORE calling stop()
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.error("Stop error:", e);
      setStatus("idle");
    }
  };

  const handleClick = () => {
    if (disabled || status === "processing") return;
    if (status === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  if (status === "unsupported") {
    return (
      <div className="relative group">
        <button
          disabled
          className="w-11 h-11 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center opacity-40 cursor-not-allowed"
        >
          <MicIcon />
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          Use Chrome for voice input
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 min-w-[44px]">
      <button
        onClick={handleClick}
        disabled={disabled || status === "processing"}
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
          ${
            status === "listening"
              ? "bg-red-500 border-2 border-red-400 mic-pulse text-white scale-110"
              : status === "processing"
                ? "bg-amber-400/20 border border-amber-400/40 text-amber-400"
                : "bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:border-amber-400/50 hover:text-amber-400"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {status === "processing" ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : status === "listening" ? (
          <StopIcon />
        ) : (
          <MicIcon />
        )}
      </button>

      {/* Live transcript preview */}
      {status === "listening" && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-red-400 animate-pulse font-medium leading-none">
            Recording...
          </span>
          {liveText && (
            <span className="text-[9px] text-[#8b949e] max-w-[120px] truncate leading-none mt-0.5">
              "{liveText}"
            </span>
          )}
        </div>
      )}
      {status === "processing" && (
        <span className="text-[10px] text-amber-400 font-medium leading-none">
          Converting...
        </span>
      )}
      {status === "idle" && !disabled && (
        <span className="text-[10px] text-[#484f58] leading-none">Mic</span>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
