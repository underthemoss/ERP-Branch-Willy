/**
 * File parsing utilities for the AI agent
 * Supports PDF and CSV extraction in the browser
 */

import Papa from "papaparse";

// ============================================================================
// Types
// ============================================================================

export interface ParsedFile {
  fileName: string;
  fileType: "pdf" | "csv" | "unknown";
  content: string;
  metadata: {
    rowCount?: number;
    columnCount?: number;
    columns?: string[];
    pageCount?: number;
    charCount: number;
  };
}

export interface FileParseError {
  fileName: string;
  error: string;
}

// ============================================================================
// CSV Parser
// ============================================================================

/**
 * Parse a CSV file and return structured text representation
 */
export async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const columns = results.meta.fields || [];

        // Build a text representation
        let content = "";

        // Add column headers
        if (columns.length > 0) {
          content += `Columns: ${columns.join(", ")}\n\n`;
        }

        // Add data rows (limit to first 100 rows to avoid context overflow)
        const maxRows = 100;
        const rowsToShow = data.slice(0, maxRows);

        content += `Data (${data.length} total rows${data.length > maxRows ? `, showing first ${maxRows}` : ""}):\n`;

        rowsToShow.forEach((row, idx) => {
          const rowStr = columns.map((col) => `${col}: ${row[col] || "(empty)"}`).join(" | ");
          content += `Row ${idx + 1}: ${rowStr}\n`;
        });

        if (data.length > maxRows) {
          content += `\n... and ${data.length - maxRows} more rows`;
        }

        resolve({
          fileName: file.name,
          fileType: "csv",
          content,
          metadata: {
            rowCount: data.length,
            columnCount: columns.length,
            columns,
            charCount: content.length,
          },
        });
      },
      error: (error) => {
        reject({
          fileName: file.name,
          error: error.message,
        } as FileParseError);
      },
    });
  });
}

// ============================================================================
// PDF Parser
// ============================================================================

/**
 * Parse a PDF file and extract text content
 * Uses pdf.js via dynamic import
 */
export async function parsePDF(file: File): Promise<ParsedFile> {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source - using local copy from public folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load the PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  const pageCount = pdf.numPages;

  // Extract text from each page (limit to first 20 pages)
  const maxPages = 20;
  const pagesToProcess = Math.min(pageCount, maxPages);

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");

    fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
  }

  if (pageCount > maxPages) {
    fullText += `\n... and ${pageCount - maxPages} more pages (not extracted to save context)`;
  }

  return {
    fileName: file.name,
    fileType: "pdf",
    content: fullText,
    metadata: {
      pageCount,
      charCount: fullText.length,
    },
  };
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Detect file type and parse accordingly
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCSV(file);
  }

  if (extension === "pdf") {
    return parsePDF(file);
  }

  // For unknown types, read as text
  const text = await file.text();
  return {
    fileName: file.name,
    fileType: "unknown",
    content: text.slice(0, 10000), // Limit to first 10k chars
    metadata: {
      charCount: Math.min(text.length, 10000),
    },
  };
}

/**
 * Check if a file type is supported
 */
export function isSupportedFileType(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "pdf";
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format parsed file content for the AI context
 */
export function formatFileForContext(parsed: ParsedFile): string {
  const header = `📎 Attached File: ${parsed.fileName}`;

  let meta = "";
  if (parsed.fileType === "csv") {
    meta = `Type: CSV | Rows: ${parsed.metadata.rowCount} | Columns: ${parsed.metadata.columnCount}`;
  } else if (parsed.fileType === "pdf") {
    meta = `Type: PDF | Pages: ${parsed.metadata.pageCount}`;
  } else {
    meta = `Type: Text | Characters: ${parsed.metadata.charCount}`;
  }

  return `${header}\n${meta}\n\n--- File Contents ---\n${parsed.content}\n--- End of File ---`;
}
