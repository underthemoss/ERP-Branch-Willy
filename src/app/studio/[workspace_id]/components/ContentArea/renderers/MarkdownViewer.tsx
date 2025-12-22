"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

/**
 * Markdown renderer using react-markdown with GFM support
 */
export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="agent-markdown text-[#383838]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
