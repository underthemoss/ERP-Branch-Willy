"use client";

import React from "react";
import { Bot } from "lucide-react";

export function AgentPanel() {
  return (
    <div className="h-full flex flex-col bg-[#F3F3F3]">
      {/* Header */}
      <div className="p-2 px-3 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-[#007ACC]" />
          <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            AI Agent
          </span>
        </div>
      </div>

      {/* Chat Area (Placeholder) */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="text-center max-w-[280px]">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-[#383838] mb-1">
            Coming Soon
          </h3>
          <p className="text-[13px] text-gray-500 mb-2 leading-relaxed">
            The AI agent panel will allow you to interact with your workspace
            data using natural language.
          </p>
          <p className="text-[11px] text-gray-400 font-semibold mb-1">
            Features planned:
          </p>
          <div className="text-xs text-gray-500 leading-relaxed text-left space-y-0.5">
            <div>• Context-aware chat</div>
            <div>• Entity search and navigation</div>
            <div>• Tool call execution</div>
            <div>• Plan vs Act workflows</div>
          </div>
        </div>
      </div>

      {/* Input Area (Disabled) */}
      <div className="p-3 border-t border-[#E5E5E5] bg-white">
        <input
          type="text"
          placeholder="Ask me anything... (coming soon)"
          disabled
          className="w-full px-3 py-2 text-[13px] bg-[#F8F8F8] border border-[#E5E5E5] rounded mb-2 text-gray-400 cursor-not-allowed"
        />
        <button
          disabled
          className="w-full py-2 bg-[#007ACC]/50 text-white text-[13px] font-medium rounded cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
