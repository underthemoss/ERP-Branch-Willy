"use client";

import { CheckCircle2, PenTool, Sparkles, Type, X } from "lucide-react";
import * as React from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignatureAcceptanceDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (data: SignatureData) => Promise<void>;
  quoteNumber?: string;
  defaultName?: string;
  loading?: boolean;
}

export interface SignatureData {
  signature: string;
}

type SignatureMode = "draw" | "type";

/**
 * ✨ Modern signature acceptance dialog
 * Clean, premium SaaS aesthetic with smooth interactions
 */
export function SignatureAcceptanceDialog({
  open,
  onClose,
  onAccept,
  quoteNumber,
  defaultName = "",
  loading = false,
}: SignatureAcceptanceDialogProps) {
  const [signatureMode, setSignatureMode] = React.useState<SignatureMode>("draw");
  const [typedSignature, setTypedSignature] = React.useState("");
  const [name, setName] = React.useState(defaultName);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showError, setShowError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [hasDrawnSignature, setHasDrawnSignature] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const signatureCanvasRef = React.useRef<SignatureCanvas>(null);

  const today = React.useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setTypedSignature(defaultName);
      setAgreedToTerms(false);
      setShowSuccess(false);
      setShowError(false);
      setErrorMessage("");
      setHasDrawnSignature(false);
      setIsSubmitting(false);
      if (signatureCanvasRef.current) {
        signatureCanvasRef.current.clear();
      }
    }
  }, [open, defaultName]);

  const handleClearSignature = () => {
    if (signatureMode === "draw" && signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      setHasDrawnSignature(false);
    } else {
      setTypedSignature("");
    }
  };

  const isSignatureEmpty = () => {
    if (signatureMode === "draw") {
      return !signatureCanvasRef.current || signatureCanvasRef.current.isEmpty();
    }
    return !typedSignature.trim();
  };

  const canSubmit =
    !isSignatureEmpty() && name.trim() && agreedToTerms && !loading && !isSubmitting;

  /**
   * Convert typed signature to a Base64 PNG image
   */
  const convertTypedSignatureToImage = (text: string): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text styling to match the preview
    ctx.font = '48px "Dancing Script", cursive';
    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw the text
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Convert to Base64 PNG
    return canvas.toDataURL("image/png");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Convert both drawn and typed signatures to Base64 PNG images (with data URL prefix)
    const dataUrl =
      signatureMode === "draw"
        ? signatureCanvasRef.current!.toDataURL("image/png")
        : convertTypedSignatureToImage(typedSignature);

    // Strip the data URL prefix (e.g., "data:image/png;base64,") to get pure Base64
    // Backend expects pure Base64 string, not a data URL
    const signature = dataUrl.split(",")[1];

    setIsSubmitting(true);
    setShowError(false);
    setErrorMessage("");

    try {
      await onAccept({ signature });
      setShowSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      setShowError(true);
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  // Error state
  if (showError) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Unable to Complete</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed">{errorMessage}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowError(false);
                    setErrorMessage("");
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">You&apos;re all set!</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your signature has been recorded. We&apos;ll send you a confirmation email shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sign to Accept</h3>
              <p className="text-sm text-slate-500 mt-0.5">Complete your signature below</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Quote Summary Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-900">Quote Details</span>
              </div>
              <div className="space-y-2.5">
                {quoteNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Quote Reference</span>
                    <span className="font-mono text-slate-900">{quoteNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-900">{today}</span>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full legal name"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder-slate-400"
                disabled={loading}
              />
            </div>

            {/* Signature Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Your Signature
              </label>

              {/* Signature Mode Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setSignatureMode("draw")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    signatureMode === "draw"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  disabled={loading}
                >
                  <PenTool className="w-4 h-4" />
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode("type")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    signatureMode === "type"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  disabled={loading}
                >
                  <Type className="w-4 h-4" />
                  Type
                </button>
              </div>

              {/* Draw Signature */}
              {signatureMode === "draw" && (
                <div className="relative">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-xl overflow-hidden">
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      canvasProps={{
                        className: "w-full h-44 cursor-crosshair",
                        style: { touchAction: "none" },
                      }}
                      backgroundColor="transparent"
                      penColor="#1e293b"
                      onEnd={() => setHasDrawnSignature(true)}
                    />
                  </div>
                  {!hasDrawnSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <PenTool className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-sm text-amber-700 font-medium">Draw your signature</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type Signature */}
              {signatureMode === "type" && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-xl p-6">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full bg-transparent border-0 text-3xl text-center focus:outline-none text-slate-800 placeholder-amber-400"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Clear Button */}
              <button
                onClick={handleClearSignature}
                className="mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                disabled={loading || isSignatureEmpty()}
              >
                Clear signature
              </button>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                disabled={loading}
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                I agree to the terms of this quote and authorize this electronic signature
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
            >
              {loading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Accept Quote
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dancing Script font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
