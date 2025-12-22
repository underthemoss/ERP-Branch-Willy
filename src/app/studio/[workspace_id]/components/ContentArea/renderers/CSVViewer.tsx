"use client";

import { useMemo } from "react";

/**
 * Parse CSV string into 2D array
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ",") {
        // End of field
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // End of row
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        if (char === "\r") i++;
      } else {
        currentCell += char;
      }
    }
  }

  // Handle last cell/row
  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

interface CSVViewerProps {
  content: string;
}

/**
 * CSV table viewer component - renders CSV as a formatted table
 */
export function CSVViewer({ content }: CSVViewerProps) {
  const data = useMemo(() => parseCSV(content), [content]);

  if (data.length === 0) {
    return <div className="text-sm text-gray-500">Empty CSV file</div>;
  }

  const headers = data[0];
  const rows = data.slice(1);

  return (
    <div className="overflow-auto border border-[#E5E5E5] rounded">
      <table className="w-full text-[13px] border-collapse">
        <thead className="sticky top-0 bg-[#F3F3F3]">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-500 border-b border-r border-[#E5E5E5] text-[11px] w-10">
              #
            </th>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-3 py-2 text-left font-semibold text-[#383838] border-b border-r border-[#E5E5E5] whitespace-nowrap"
              >
                {header || `Column ${idx + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}>
              <td className="px-3 py-1.5 text-gray-400 border-r border-[#E5E5E5] text-[11px]">
                {rowIdx + 1}
              </td>
              {headers.map((_, colIdx) => (
                <td
                  key={colIdx}
                  className="px-3 py-1.5 text-[#383838] border-r border-[#E5E5E5] whitespace-nowrap"
                >
                  {row[colIdx] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 bg-[#F3F3F3] border-t border-[#E5E5E5] text-[11px] text-gray-500">
        {rows.length} row{rows.length !== 1 ? "s" : ""} × {headers.length} column
        {headers.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
