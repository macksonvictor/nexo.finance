import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import mascotAssetUrl from "@/assets/nexo-ai-mascot.svg";
import brandAssetUrl from "@/assets/nexo-ai-brand.svg";
import "./NexoCubeLogo.css";

export type NexoCubeVariant = "mascot" | "brand";

interface NexoCubeLogoProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
  variant?: NexoCubeVariant;
  glow?: boolean;
}

export function NexoCubeLogo({
  size = 32,
  className,
  decorative = true,
  ariaLabel = "Nexo IA",
  variant = "mascot",
  glow = false,
}: NexoCubeLogoProps) {
  const style = {
    "--cube-size": `${size}px`,
  } as CSSProperties & Record<"--cube-size", string>;
  const imageUrl = variant === "brand" ? brandAssetUrl : mascotAssetUrl;
  const variantClass =
    variant === "brand" ? "nexo-cube-asset--brand" : "nexo-cube-asset--mascot";

  return (
    <span
      className={cn(
        "nexo-cube-asset",
        variantClass,
        glow && "nexo-cube-asset--glow",
        className
      )}
      style={style}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <span className="nexo-cube-asset__shell">
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="nexo-cube-asset__image"
        />
      </span>
    </span>
  );
}
