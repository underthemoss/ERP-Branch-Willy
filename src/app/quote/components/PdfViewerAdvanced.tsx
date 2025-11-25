"use client";

import { AlertCircle, Download, Maximize2, Printer, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerAdvancedProps {
  pdfUrl: string;
  onAcceptClick?: () => void;
  showAcceptButton?: boolean;
  /** Whether the auth banner is shown above the viewer (affects height calculation) */
  hasBanner?: boolean;
}

type FitMode = "width" | "page" | "custom";

/**
 * 📄 Advanced DocuSign-style PDF viewer
 * Features: zoom, navigation, mobile support, professional UI
 */
export function PdfViewerAdvanced({
  pdfUrl,
  onAcceptClick,
  showAcceptButton = false,
  hasBanner = false,
}: PdfViewerAdvancedProps) {
  const [scale, setScale] = React.useState<number>(1.0);
  const [fitMode, setFitMode] = React.useState<FitMode>("page");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [containerWidth, setContainerWidth] = React.useState<number>(800);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3.0;

  // Measure container width on mount and resize
  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate scale based on fit mode
  const effectiveScale = React.useMemo(() => {
    if (fitMode === "width") {
      // Fit to container width with padding
      return (containerWidth - 80) / 612; // 612 is standard PDF page width
    } else if (fitMode === "page") {
      // Fit entire page in view
      return Math.min((containerWidth - 80) / 612, (window.innerHeight - 200) / 792);
    }
    return scale;
  }, [fitMode, scale, containerWidth]);

  const onDocumentLoadSuccess = () => {
    setLoading(false);
    setError(false);
  };

  const onDocumentLoadError = () => {
    setLoading(false);
    setError(true);
  };

  const handleZoomIn = () => {
    setFitMode("custom");
    setScale((prev) => Math.min(prev + 0.25, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setFitMode("custom");
    setScale((prev) => Math.max(prev - 0.25, MIN_ZOOM));
  };

  const handleFitPage = () => {
    setFitMode("page");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "quote.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.open(pdfUrl, "_blank");
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const zoomPercentage = Math.round(effectiveScale * 100);

  return (
    <div
      className={`flex flex-col bg-gray-100 relative ${hasBanner ? "h-[calc(100vh-80px)]" : "h-screen"}`}
    >
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3 shadow-sm">
        {/* Left: Document title */}
        <div className="flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Quote Document</h2>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          {showAcceptButton && onAcceptClick && !loading && !error && (
            <button
              onClick={onAcceptClick}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              title="Accept & Sign Quote"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="hidden sm:inline">Accept & Sign</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-block min-w-full">
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Document</h2>
                <p className="text-gray-600 mb-4">
                  There was an error loading the PDF. Please try downloading it instead.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
              </div>
            )}

            {!error && (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                className="shadow-2xl"
              >
                <Page
                  pageNumber={1}
                  scale={effectiveScale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white shadow-lg"
                />
              </Document>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer with Controls */}
      {!loading && !error && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-10">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg bg-white">
              <button
                onClick={handleZoomOut}
                disabled={effectiveScale <= MIN_ZOOM}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[3.5rem] text-center">
                {zoomPercentage}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={effectiveScale >= MAX_ZOOM}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Fit Page */}
            <button
              onClick={handleFitPage}
              className={`p-2 rounded-lg transition-colors ${
                fitMode === "page"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
              title="Fit to page"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
