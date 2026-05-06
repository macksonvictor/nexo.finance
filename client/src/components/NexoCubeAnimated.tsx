import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  NEXO_AI_MOTION_MANIFEST,
  resolveMascotMotionEngine,
  type NexoAIMascotMood,
  type NexoAIMotionEngine,
  type NexoAIMotionIntensity,
} from "@/lib/nexoAIMotion";
import { NexoLottieMascot } from "./NexoLottieMascot";
import "./NexoCubeLogo.css";

interface NexoCubeAnimatedProps {
  size?: number;
  className?: string;
  decorative?: boolean;
  ariaLabel?: string;
  engine?: NexoAIMotionEngine;
  intensity?: NexoAIMotionIntensity;
  mood?: NexoAIMascotMood;
  allowHoverReaction?: boolean;
  allowJumpReaction?: boolean;
  allowPressReaction?: boolean;
}

export function NexoCubeAnimated({
  size = 32,
  className,
  decorative = true,
  ariaLabel = "Nexo IA",
  engine,
  intensity = "soft",
  mood = "idle",
  allowHoverReaction = false,
  allowJumpReaction = false,
  allowPressReaction = false,
}: NexoCubeAnimatedProps) {
  const resolvedEngine = resolveMascotMotionEngine(engine);
  // The final Rive cube will reuse the same state contract, but the active
  // product mascot is the monochrome Lottie orb to avoid old cube fallbacks.
  const activeEngine = resolvedEngine === "css" ? "css" : "lottie";
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
      data-motion-engine={activeEngine}
      data-motion-version={NEXO_AI_MOTION_MANIFEST.version}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <span className="nexo-lottie-mascot__fallback" aria-hidden="true" />
    </span>
  );

  if (activeEngine === "lottie") {
    return (
      <NexoLottieMascot
        size={size}
        state={mood}
        intensity={intensity}
        className={className}
        fallback={fallback}
        decorative={decorative}
        ariaLabel={ariaLabel}
        allowHoverReaction={allowHoverReaction}
        allowJumpReaction={allowJumpReaction}
        allowPressReaction={allowPressReaction}
      />
    );
  }

  return fallback;
}
