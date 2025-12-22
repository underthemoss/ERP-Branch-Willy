"use client";

interface TextViewerProps {
  content: string;
}

/**
 * Default text/code viewer - plain monospace text
 */
export function TextViewer({ content }: TextViewerProps) {
  return (
    <pre className="text-sm font-mono bg-[#F8F8F8] p-4 rounded border border-[#E5E5E5] overflow-auto">
      {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
    </pre>
  );
}
