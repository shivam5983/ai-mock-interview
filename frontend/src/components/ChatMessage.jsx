function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessage({ message }) {
  const isAI = message.role === 'ai'

  return (
    <div
      className={`flex items-end gap-2 ${isAI ? 'justify-start animate-slide-left' : 'justify-end animate-slide-right'}`}
    >
      {/* AI Avatar */}
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-amber-400 text-xs font-bold">AI</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[78%] ${isAI ? 'items-start' : 'items-end'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isAI
              ? 'bg-[#161b22] border border-[#30363d] text-[#e6edf3] rounded-bl-sm'
              : 'bg-amber-400 text-[#0d1117] font-medium rounded-br-sm'
            }
            ${message.isSystem ? 'border-amber-400/30 bg-amber-400/10 text-amber-300 text-center text-xs italic' : ''}
            ${message.isTimesUp ? 'border-red-400/30 bg-red-400/10 text-red-300' : ''}
          `}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[#484f58] px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-8 h-8 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-[#8b949e] text-xs font-bold">You</span>
        </div>
      )}
    </div>
  )
}
