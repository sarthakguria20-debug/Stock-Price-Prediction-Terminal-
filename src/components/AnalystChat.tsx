import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, StockQuote } from "../types";
import { Send, User, MessageSquareCode, Sparkles, AlertCircle } from "lucide-react";

interface AnalystChatProps {
  stock: StockQuote;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
}

const QUICK_PROMPTS = [
  "Evaluate current RSI triggers.",
  "Interpret Bollinger Bands volatility.",
  "What's the short-term catalyst expectation?",
  "Explain Monte Carlo statistics simply."
];

export default function AnalystChat({ stock, chatHistory, onSendMessage, isChatLoading }: AnalystChatProps) {
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handlePromptClick = (promptText: string) => {
    if (isChatLoading) return;
    onSendMessage(promptText);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col h-full min-h-[460px]" id="chat-panel">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
        <MessageSquareCode className="h-5 w-5 text-emerald-500" />
        <div className="text-left">
          <h3 className="text-sm font-display font-bold text-white tracking-tight uppercase">
            Quant Intelligence Analyst
          </h3>
          <p className="text-[10px] text-white/40 font-sans">
            Ask questions regarding <strong className="text-emerald-500 font-mono">{stock.ticker}</strong>'s indicators or macro projections.
          </p>
        </div>
      </div>

      {/* Messages thread bubble log */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-[220px] max-h-[380px]">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-white/30 select-none">
            <Sparkles className="h-7 w-7 text-white/20 mb-2.5 animate-pulse" />
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Compiler Engine Idle</p>
            <p className="text-[10px] text-white/30 max-w-[200px] mt-1 leading-normal">
              Ask about moving averages crossovers, momentum RSI readings, or options flow metrics.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] text-xs text-left ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
                id={`chat-msg-${msg.id}`}
              >
                {/* Visual Avatar icons */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                  isUser 
                    ? "bg-white/10 border-white/10 text-white" 
                    : "bg-white border-white text-black"
                }`}>
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] text-white/30 font-mono block px-1">
                    {msg.sender === 'user' ? 'Client Request' : 'System Analyst'} • {msg.timestamp}
                  </span>
                  <div className={`p-2.5 rounded-xl border ${
                    isUser 
                      ? "bg-[#141414] border-white/10 text-white" 
                      : "bg-white/5 border-white/5 text-white/90 leading-relaxed font-sans font-medium whitespace-pre-line"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Loading Bubble */}
        {isChatLoading && (
          <div className="flex gap-2.5 max-w-[80%] text-xs text-left">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border bg-white border-white text-black">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-white/30 font-mono">System Analyst is synthesizing...</span>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Bubbles Grid */}
      <div className="mb-3">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block text-left mb-1.5 px-1 select-none">Suggested Prompts</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(p)}
              disabled={isChatLoading}
              className="text-[10px] bg-[#141414] hover:bg-white border border-white/5 px-2.5 py-1.5 rounded-lg text-white/55 hover:text-black hover:border-white transition cursor-pointer text-left disabled:opacity-50 font-medium"
              id={`quick-prompt-${idx}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input container */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 pt-3">
        <input
          type="text"
          placeholder="Consult trading variables..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isChatLoading}
          className="flex-1 bg-[#141414]/50 hover:bg-[#141414] border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white focus:ring-1 focus:ring-white disabled:opacity-50 transition"
          id="chat-user-input"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isChatLoading}
          className="bg-white hover:bg-white/90 disabled:bg-white/10 text-black font-semibold disabled:text-white/20 p-2 rounded-lg transition shrink-0 cursor-pointer"
          id="btn-send-chat"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
