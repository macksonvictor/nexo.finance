import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface NexoCubeLogoProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
}

const NEXO_AI_CUBE_SRC = "/nexo-ai-cube.svg";

export function NexoCubeLogo({
  size = 32,
  className,
  decorative = true,
  ariaLabel = "Nexo IA",
}: NexoCubeLogoProps) {
  const style = {
    width: size,
    height: size,
    display: "inline-block",
    flexShrink: 0,
  } satisfies CSSProperties;

  const imageStyle = {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "contain",
    pointerEvents: "none",
  } satisfies CSSProperties;

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={style}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <img
        src={NEXO_AI_CUBE_SRC}
        alt={decorative ? "" : ariaLabel}
        aria-hidden={decorative || undefined}
        draggable={false}
        className="select-none"
        style={imageStyle}
      />
    </span>
  );
}
