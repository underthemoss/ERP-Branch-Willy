"use client";

import { useMemo } from "react";

interface JSONViewerProps {
  content: string;
}

/**
 * JSON viewer with pretty-printing
 */
export function JSONViewer({ content }: JSONViewerProps) {
  const formattedContent = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      // Keep original if not valid JSON
      return content;
    }
  }, [content]);

  return (
    <pre className="text-sm font-mono bg-[#F8F8F8] p-4 rounded border border-[#E5E5E5] overflow-auto">
      {formattedContent}
    </pre>
  );
}
