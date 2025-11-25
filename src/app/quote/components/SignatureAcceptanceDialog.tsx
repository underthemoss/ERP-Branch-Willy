"use client";

import { CheckCircle2, PenTool, Type, X } from "lucide-react";
import * as React from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignatureAcceptanceDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: (data: SignatureData) => void;
  quoteNumber?: string;
  totalAmount: string;
  defaultName?: string;
  loading?: boolean;
}

export interface SignatureData {
  signature: string; // base64 image or typed text
  signatureType: "draw" | "type";
  name: string;
  date: string;
  agreedToTerms: boolean;
}

type SignatureMode = "draw" | "type";

/**
 * 📝 DocuSign-style signature acceptance dialog
 * Features: Draw or Type signature, name field, date, terms checkbox
 */
export function SignatureAcceptanceDialog({
  open,
  onClose,
  onAccept,
  quoteNumber,
  totalAmount,
  defaultName = "",
  loading = false,
}: SignatureAcceptanceDialogProps) {
  const [signatureMode, setSignatureMode] = React.useState<SignatureMode>("draw");
  const [typedSignature, setTypedSignature] = React.useState("");
  const [name, setName] = React.useState(defaultName);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = React.useState(false);

  const signatureCanvasRef = React.useRef<SignatureCanvas>(null);

  // Auto-populate today's date
  const today = React.useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setTypedSignature(defaultName); // Pre-fill typed signature with recipient name
      setAgreedToTerms(false);
      setShowSuccess(false);
      setHasDrawnSignature(false);
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

  const canSubmit = !isSignatureEmpty() && name.trim() && agreedToTerms && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const signatureData: SignatureData = {
      signature:
        signatureMode === "draw" ? signatureCanvasRef.current!.toDataURL() : typedSignature,
      signatureType: signatureMode,
      name: name.trim(),
      date: today,
      agreedToTerms,
    };

    // Show success animation
    setShowSuccess(true);

    // Call onAccept after brief delay for animation
    setTimeout(() => {
      onAccept(signatureData);
    }, 1500);
  };

  if (!open) return null;

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 transition-opacity" />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quote Accepted!</h3>
              <p className="text-gray-600">
                Your acceptance has been recorded. You will receive a confirmation shortly.
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
        <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Adopt and Sign</h3>
              <p className="text-sm text-gray-600 mt-1">Review and sign to accept this quote</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Agreement Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Quote Agreement</h4>
              <p className="text-sm text-gray-700 mb-2">
                By signing below, you agree to accept the quote with the following details:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                {quoteNumber && (
                  <li>
                    <span className="font-medium">Quote Number:</span> {quoteNumber}
                  </li>
                )}
                <li>
                  <span className="font-medium">Total Amount:</span> {totalAmount}
                </li>
                <li>
                  <span className="font-medium">Date:</span> {today}
                </li>
              </ul>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Signature Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Signature <span className="text-red-500">*</span>
              </label>

              {/* Signature Mode Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSignatureMode("draw")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    signatureMode === "draw"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  disabled={loading}
                >
                  <PenTool className="w-4 h-4" />
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode("type")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    signatureMode === "type"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg overflow-hidden">
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      canvasProps={{
                        className: "w-full h-48 cursor-crosshair",
                        style: { touchAction: "none" },
                      }}
                      backgroundColor="rgb(254, 252, 232)"
                      penColor="#000000"
                      onEnd={() => setHasDrawnSignature(true)}
                    />
                  </div>
                  {!hasDrawnSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <PenTool className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-yellow-700 font-medium">Sign Here</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type Signature */}
              {signatureMode === "type" && (
                <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg p-8">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full bg-transparent border-0 text-4xl text-center focus:outline-none placeholder-yellow-600"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Clear Button */}
              <button
                onClick={handleClearSignature}
                className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
                disabled={loading || isSignatureEmpty()}
              >
                Clear Signature
              </button>
            </div>

            {/* Date (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Date</label>
              <input
                type="text"
                value={today}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                <span className="font-semibold">I agree to the terms of this quote</span> and
                understand that by signing, I am accepting the quote and its conditions.
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Adopt and Sign
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Dancing Script font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
