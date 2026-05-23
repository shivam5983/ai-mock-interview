export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-slide-left">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
        <span className="text-amber-400 text-xs font-bold">AI</span>
      </div>
      {/* Bubble */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  )
}
