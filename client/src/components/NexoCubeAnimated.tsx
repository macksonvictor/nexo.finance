import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  NEXO_AI_MOTION_MANIFEST,
  resolveMascotMotionEngine,
  type NexoAIMascotMood,
  type NexoAIMotionEngine,
  type NexoAIMotionIntensity,
} from "@/lib/nexoAIMotion";
import mascotAssetUrl from "@/assets/nexo-ai-mascot.svg";
import { NexoRiveMascot } from "./NexoRiveMascot";
import "./NexoCubeLogo.css";

interface NexoCubeAnimatedProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
  engine?: NexoAIMotionEngine;
  intensity?: NexoAIMotionIntensity;
  mood?: NexoAIMascotMood;
}

export function NexoCubeAnimated({
  size = 32,
  className,
  decorative = true,
  ariaLabel = "Nexo IA",
  engine,
  intensity = "soft",
  mood = "idle",
}: NexoCubeAnimatedProps) {
  const resolvedEngine = resolveMascotMotionEngine(engine);
  const style = {
    "--cube-size": `${size}px`,
  } as CSSProperties & Record<"--cube-size", string>;

  const fallback = (
    <span
      className={cn(
        "nexo-cube-asset nexo-cube-asset--mascot",
        intensity === "hero" ? "nexo-cube-asset--hero" : "nexo-cube-asset--soft",
        `nexo-cube-asset--${mood}`,
        className
      )}
      style={style}
      data-motion-engine={resolvedEngine}
      data-motion-version={NEXO_AI_MOTION_MANIFEST.version}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <span className="nexo-cube-asset__shell">
        <img
          src={mascotAssetUrl}
          alt=""
          aria-hidden="true"
          className="nexo-cube-asset__image"
        />
      </span>
    </span>
  );

  if (resolvedEngine === "rive") {
    return (
      <NexoRiveMascot
        size={size}
        state={mood}
        intensity={intensity}
        className={className}
        fallback={fallback}
        decorative={decorative}
        ariaLabel={ariaLabel}
      />
    );
  }

  return fallback;
}
