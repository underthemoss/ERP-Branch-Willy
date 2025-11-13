"use client";

import { useConfig } from "@/providers/ConfigProvider";
import { useMemo, useState } from "react";

type ImageSize = "list" | "card" | "preview" | "full";

interface GeneratedImageProps {
  entity: "price" | "pim-product";
  entityId: string;
  size?: ImageSize;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  showIllustrativeBanner?: boolean;
}

const FALLBACK_IMAGE_URL = "https://appcdn.equipmentshare.com/img/cogplaceholder.png";

/**
 * GeneratedImage component that displays a dynamically generated image for an entity.
 * The component fetches images from entity-specific API endpoints based on the entity ID.
 * Includes loading state and fallback image handling.
 *
 * @example
 * ```tsx
 * <GeneratedImage
 *   entity="price"
 *   entityId="price-123"
 *   size="card"
 *   alt="Track Excavator"
 *   width={200}
 *   height={200}
 * />
 * ```
 */
export function GeneratedImage({
  entity,
  entityId,
  size = "list",
  alt = "Generated image",
  className,
  width,
  height,
  style,
  showIllustrativeBanner = true,
}: GeneratedImageProps) {
  const { graphqlUrl } = useConfig();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = useMemo(() => {
    // Build entity-specific image URL
    const url = new URL(graphqlUrl);
    const pathPrefix = url.pathname.replace(/\/graphql$/, "");

    let baseUrl: string;
    switch (entity) {
      case "price":
        baseUrl = `${url.protocol}//${url.host}${pathPrefix}/api/images/prices/${entityId}`;
        break;
      case "pim-product":
        baseUrl = `${url.protocol}//${url.host}${pathPrefix}/api/images/pim-products/${entityId}`;
        break;
      default:
        throw new Error(`Unsupported entity type: ${entity}`);
    }

    // Add size parameter if not the default
    if (size !== "list") {
      return `${baseUrl}?size=${size}`;
    }
    return baseUrl;
  }, [graphqlUrl, entity, entityId, size]);

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

      {/* Illustrative banner - horizontal bar at 75% down the image */}
      {showIllustrativeBanner && size !== "list" && (
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: 0,
            right: 0,
            backgroundColor: "rgba(100, 100, 100, 0.5)",
            color: "#ffffff",
            padding: "2px 8px",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            textAlign: "center",
            whiteSpace: "nowrap",
            zIndex: 10,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          Illustrative Image Only
        </div>
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
