import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mascotAnimation from "@/assets/lottie/nexo-ai-mascot-orb.json";
import { cn } from "@/lib/utils";
import {
  NEXO_AI_MOTION_MANIFEST,
  type NexoAIMascotMood,
  type NexoAIMotionIntensity,
} from "@/lib/nexoAIMotion";
import {
  NEXO_MASCOT_INTERACTION_MOTION,
  resolveNexoMascotMood,
  resolveNexoMascotMotion,
  type NexoMascotMotionSpec,
} from "@/lib/mascotMotion";
import type { NexoBrainRiveState } from "@shared/riveState";
import "./NexoLottieMascot.css";

type LottieSegment = readonly [number, number];

interface NexoLottieMascotProps {
  size?: number;
  state?: NexoAIMascotMood;
  intensity?: NexoAIMotionIntensity;
  className?: string;
  fallback?: ReactNode;
  ariaLabel?: string;
  decorative?: boolean;
  allowHoverReaction?: boolean;
  allowJumpReaction?: boolean;
  allowPressReaction?: boolean;
}

function playSegment(
  ref: LottieRefCurrentProps | null,
  segment: LottieSegment,
  loop: boolean,
  speed: number
) {
  if (!ref) return;

  if (ref.animationItem) {
    ref.animationItem.loop = loop;
  }

  ref.setSpeed(speed);
  ref.playSegments([segment[0], segment[1]], true);
}

function playMotion(
  ref: LottieRefCurrentProps | null,
  motion: NexoMascotMotionSpec
) {
  playSegment(ref, motion.segment, motion.loop, motion.speed);
}

export function NexoLottieMascot({
  size = 32,
  state = "idle",
  intensity = "soft",
  className,
  fallback,
  ariaLabel = "Nexo IA",
  decorative = true,
  allowHoverReaction = false,
  allowJumpReaction = false,
  allowPressReaction = false,
}: NexoLottieMascotProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const mood = resolveNexoMascotMood(state);
  const motion = useMemo(() => resolveNexoMascotMotion(mood), [mood]);
  const activeMoodRef = useRef<NexoBrainRiveState>(mood);
  const activeMotionRef = useRef<NexoMascotMotionSpec>(motion);
  const [reactionMood, setReactionMood] = useState<NexoBrainRiveState | null>(
    null
  );
  const animationData = mascotAnimation;
  const shouldLoop = motion.loop;
  const baseContentScale =
    intensity === "hero"
      ? NEXO_AI_MOTION_MANIFEST.lottie.contentScale
      : NEXO_AI_MOTION_MANIFEST.lottie.contentScale;
  const contentScale =
    reactionMood === "surprised"
      ? NEXO_AI_MOTION_MANIFEST.lottie.jumpContentScale
      : baseContentScale;
  const style = {
    "--mascot-size": `${size}px`,
    "--mascot-content-scale": String(contentScale),
  } as CSSProperties & Record<"--mascot-size" | "--mascot-content-scale", string>;

  useEffect(() => {
    activeMoodRef.current = mood;
    activeMotionRef.current = motion;
    setReactionMood(null);
    playMotion(lottieRef.current, motion);
  }, [mood, motion]);

  function handleComplete() {
    const currentMood = activeMoodRef.current;

    if (NEXO_AI_MOTION_MANIFEST.lottie.loop[currentMood]) return;

    activeMoodRef.current = "idle";
    activeMotionRef.current = resolveNexoMascotMotion("idle");
    setReactionMood(null);
    playMotion(lottieRef.current, activeMotionRef.current);
  }

  function handleDomLoaded() {
    playMotion(lottieRef.current, activeMotionRef.current);
  }

  function handlePointerEnter() {
    if (
      (!allowHoverReaction && !allowJumpReaction) ||
      activeMoodRef.current !== "idle"
    ) {
      return;
    }

    if (allowJumpReaction) {
      activeMoodRef.current = "surprised";
      setReactionMood("surprised");
      playSegment(
        lottieRef.current,
        NEXO_MASCOT_INTERACTION_MOTION.celebrate.segment,
        NEXO_MASCOT_INTERACTION_MOTION.celebrate.loop,
        NEXO_MASCOT_INTERACTION_MOTION.celebrate.speed
      );
      return;
    }

    activeMoodRef.current = "confident";
    setReactionMood("confident");
    playSegment(
      lottieRef.current,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.segment,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.loop,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.speed
    );
  }

  function handlePointerDown() {
    if (!allowPressReaction || activeMoodRef.current !== "idle") return;

    activeMoodRef.current = "confident";
    setReactionMood("confident");
    playSegment(
      lottieRef.current,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.segment,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.loop,
      NEXO_MASCOT_INTERACTION_MOTION.pressConfirm.speed
    );
  }

  return (
    <span
      className={cn(
        "nexo-lottie-mascot",
        intensity === "hero" && "nexo-lottie-mascot--hero",
        className
      )}
      style={style}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onFocus={handlePointerEnter}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      <span className="nexo-lottie-mascot__fallback" aria-hidden="true">
        {fallback}
      </span>
      <Lottie
        key="nexo-ai-mascot"
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={shouldLoop}
        renderer="svg"
        rendererSettings={{
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        }}
        className="nexo-lottie-mascot__player"
        onDOMLoaded={handleDomLoaded}
        onComplete={handleComplete}
      />
    </span>
  );
}
