"use client";

import { useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type FundChatWidgetProps = {
  fundName: string;
  fundContext: string;
};

export default function FundChatWidget({ fundName, fundContext }: FundChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(
    () => [
      `Is ${fundName} good for long-term SIP?`,
      "What are the key risks here?",
      "How does this compare to peers?",
      "Should I avoid this fund right now?",
    ],
    [fundName]
  );

  const hasUserMessage = messages.some((message) => message.role === "user");

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isTyping) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsTyping(true);

    try {
      const res = await fetch("/api/fund-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, fundContext }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = (await res.json()) as { reply?: string };
      const reply = data.reply?.trim();
      if (reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch {
      setError("Unable to reach FundSense AI right now.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="bg-slate-800/70 border border-white/[0.08] rounded-2xl p-5 sm:p-6">
      {!hasUserMessage && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((chip) => (
            <button
              key={chip}
              type="button"
              onMouseDown={() => sendMessage(chip)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-100 bg-indigo-500/15 border border-indigo-500/30 rounded-full hover:bg-indigo-500/25 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-500 text-white rounded-br-md"
                    : "bg-slate-700 text-slate-100 rounded-bl-md"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 rounded-2xl rounded-bl-md px-4 py-2 text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${fundName}...`}
          className="flex-1 bg-slate-900/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 px-4 py-3 outline-none focus:border-indigo-500/50"
        />
        <button
          type="button"
          onMouseDown={() => sendMessage(input)}
          className="px-4 py-3 text-sm font-semibold text-white bg-indigo-500/80 rounded-xl hover:bg-indigo-500 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
