import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface NexoCubeLogoProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
}

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

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={style}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden={decorative || undefined}
        focusable="false"
        className="block h-full w-full select-none"
      >
        <path
          d="M50 10 80 27.5 50 45 20 27.5 50 10Z"
          stroke="#F7F7F7"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 27.5V66L50 84V45"
          stroke="#F7F7F7"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80 27.5V66L50 84"
          stroke="#F7F7F7"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
