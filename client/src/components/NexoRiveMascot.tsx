import { lazy, Suspense, type ReactNode } from "react";
import {
  NEXO_AI_MOTION_MANIFEST,
  type NexoAIMascotMood,
  type NexoAIMotionIntensity,
} from "@/lib/nexoAIMotion";
import "./NexoRiveMascot.css";

const NexoRiveMascotCanvas = lazy(() =>
  import("./NexoRiveMascotCanvas").then((module) => ({
    default: module.NexoRiveMascotCanvas,
  }))
);

interface NexoRiveMascotProps {
  size?: number;
  state?: NexoAIMascotMood;
  intensity?: NexoAIMotionIntensity;
  className?: string;
  fallback: ReactNode;
  riveSrc?: string | null;
  stateMachine?: string;
  ariaLabel?: string;
  decorative?: boolean;
}

export type NexoRiveMascotCanvasProps = {
  size: number;
  state: NexoAIMascotMood;
  intensity: NexoAIMotionIntensity;
  className?: string;
  fallback: ReactNode;
  riveSrc: string;
  stateMachine: string;
  ariaLabel: string;
  decorative: boolean;
};

export function NexoRiveMascot({
  size = 32,
  state = "idle",
  intensity = "soft",
  className,
  fallback,
  riveSrc = NEXO_AI_MOTION_MANIFEST.rive.asset,
  stateMachine = NEXO_AI_MOTION_MANIFEST.rive.stateMachine,
  ariaLabel = "Nexo IA",
  decorative = true,
}: NexoRiveMascotProps) {
  if (!riveSrc) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      <NexoRiveMascotCanvas
        size={size}
        state={state}
        intensity={intensity}
        className={className}
        fallback={fallback}
        riveSrc={riveSrc}
        stateMachine={stateMachine}
        ariaLabel={ariaLabel}
        decorative={decorative}
      />
    </Suspense>
  );
}
