"use client";

import { useConfig } from "@/providers/ConfigProvider";
import { useMemo, useState } from "react";

interface GeneratedImageProps {
  prompt: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

const FALLBACK_IMAGE_URL = "https://appcdn.equipmentshare.com/img/cogplaceholder.png";

/**
 * GeneratedImage component that displays a dynamically generated image based on a prompt.
 * The prompt is base64 encoded and used as the key parameter for the image generation API.
 * Includes loading state and fallback image handling.
 *
 * @example
 * ```tsx
 * <GeneratedImage
 *   prompt="Generate a flat minimalist vector illustration of a Track Excavator"
 *   alt="Track Excavator"
 *   width={200}
 *   height={200}
 * />
 * ```
 */
export function GeneratedImage({
  prompt,
  alt = "Generated image",
  className,
  width,
  height,
  style,
}: GeneratedImageProps) {
  const { imageGenerationUrl } = useConfig();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = useMemo(() => {
    // Base64 encode the prompt (UTF-8 safe)
    const base64Prompt = btoa(unescape(encodeURIComponent(prompt)));
    return `${imageGenerationUrl}?key=${base64Prompt}`;
  }, [imageGenerationUrl, prompt]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div style={{ ...style, position: style?.position || "relative" }}>
      {/* Fallback image - always visible */}
      <img
        src={FALLBACK_IMAGE_URL}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Loading shimmer overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite ease-in-out",
          }}
        />
      )}

      {/* Generated image - fades in when loaded */}
      {!hasError && (
        <img
          src={imageUrl}
          alt={alt}
          className={className}
          width={width}
          height={height}
          style={{
            ...style,
            position: "absolute",
            top: 0,
            left: 0,
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Keyframes for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
