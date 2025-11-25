"use client";

import {
  AlertCircle,
  Download,
  FileText,
  Maximize2,
  PenLine,
  Printer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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
  hasBanner?: boolean;
}

type FitMode = "width" | "page" | "custom";

/**
 * 📄 Modern PDF viewer with premium SaaS aesthetic
 * Features: smooth interactions, refined UI, professional design
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

  const effectiveScale = React.useMemo(() => {
    if (fitMode === "width") {
      return (containerWidth - 80) / 612;
    } else if (fitMode === "page") {
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
      className={`flex flex-col bg-gradient-to-b from-slate-100 to-slate-200 relative ${hasBanner ? "h-[calc(100vh-72px)]" : "h-screen"}`}
    >
      {/* Top Toolbar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 flex items-center justify-between flex-wrap gap-3 shadow-sm">
        {/* Left: Document title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your Quote</h2>
            <p className="text-xs text-slate-500">Review and sign below</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-medium shadow-sm"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-medium shadow-sm"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          {showAcceptButton && onAcceptClick && !loading && !error && (
            <button
              onClick={onAcceptClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              title="Accept & Sign Quote"
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Accept & Sign</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-block min-w-full">
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-200 border-t-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Loading your document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Unable to Load Document
                </h2>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  We couldn&apos;t load the PDF. Try downloading it directly instead.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
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
                className="shadow-2xl rounded-lg overflow-hidden"
              >
                <Page
                  pageNumber={1}
                  scale={effectiveScale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white"
                />
              </Document>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer with Controls */}
      {!loading && !error && (
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 py-3 shadow-lg z-10">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm">
              <button
                onClick={handleZoomOut}
                disabled={effectiveScale <= MIN_ZOOM}
                className="p-2.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-l-xl border-r border-slate-200"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[4rem] text-center tabular-nums">
                {zoomPercentage}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={effectiveScale >= MAX_ZOOM}
                className="p-2.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-r-xl border-l border-slate-200"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Fit Page */}
            <button
              onClick={handleFitPage}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                fitMode === "page"
                  ? "bg-emerald-100 text-emerald-700 shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm"
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
