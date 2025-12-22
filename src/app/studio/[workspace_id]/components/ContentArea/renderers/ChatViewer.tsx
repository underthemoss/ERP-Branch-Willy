"use client";

interface ChatViewerProps {
  content: string;
}

/**
 * Chat session viewer (placeholder for future implementation)
 */
export function ChatViewer({ content }: ChatViewerProps) {
  return (
    <div className="p-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded">
      <p className="text-[13px] text-gray-500">Chat viewer coming soon...</p>
      <pre className="mt-2 text-xs text-gray-400 overflow-auto">{content}</pre>
    </div>
  );
}
