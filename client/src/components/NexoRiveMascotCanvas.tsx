import {
  Alignment,
  Fit,
  Layout,
  StateMachineInputType,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-webgl2";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  NEXO_AI_MASCOT_STATE_ALIASES,
  NEXO_AI_MOTION_MANIFEST,
  type NexoAIMascotMood,
} from "@/lib/nexoAIMotion";
import type { NexoRiveMascotCanvasProps } from "./NexoRiveMascot";

const MASCOT_MOOD_INDEX = {
  idle: 0,
  reading: 1,
  processing: 2,
  responding: 3,
  alert: 4,
  confident: 5,
  curious: 6,
} satisfies Record<
  Exclude<NexoAIMascotMood, "thinking" | "speaking" | "listening">,
  number
>;

function resolveMascotMood(state: NexoAIMascotMood) {
  if (state === "thinking" || state === "speaking" || state === "listening") {
    return NEXO_AI_MASCOT_STATE_ALIASES[state];
  }

  return state;
}

export function NexoRiveMascotCanvas({
  size,
  state,
  intensity,
  className,
  fallback,
  riveSrc,
  stateMachine,
  ariaLabel,
  decorative,
}: NexoRiveMascotCanvasProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const mood = resolveMascotMood(state);
  const style = {
    "--cube-size": `${size}px`,
  } as CSSProperties & Record<"--cube-size", string>;
  const layout = useMemo(
    () => new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    []
  );

  const { rive, RiveComponent } = useRive({
    src: riveSrc,
    stateMachines: stateMachine,
    autoplay: true,
    layout,
    automaticallyHandleEvents: false,
    onLoad: () => {
      setHasLoaded(true);
      setLoadFailed(false);
    },
    onLoadError: () => {
      setLoadFailed(true);
      setHasLoaded(false);
    },
  });

  const moodInput = useStateMachineInput(
    rive,
    stateMachine,
    NEXO_AI_MOTION_MANIFEST.rive.inputs.mood,
    MASCOT_MOOD_INDEX[mood]
  );
  const intensityInput = useStateMachineInput(
    rive,
    stateMachine,
    NEXO_AI_MOTION_MANIFEST.rive.inputs.intensity,
    intensity === "hero" ? 1 : 0
  );
  const hoveredInput = useStateMachineInput(
    rive,
    stateMachine,
    NEXO_AI_MOTION_MANIFEST.rive.inputs.hovered,
    false
  );
  const blinkInput = useStateMachineInput(
    rive,
    stateMachine,
    NEXO_AI_MOTION_MANIFEST.rive.inputs.blink
  );

  useEffect(() => {
    if (moodInput?.type === StateMachineInputType.Number) {
      moodInput.value = MASCOT_MOOD_INDEX[mood];
    }
  }, [mood, moodInput]);

  useEffect(() => {
    if (intensityInput?.type === StateMachineInputType.Number) {
      intensityInput.value = intensity === "hero" ? 1 : 0;
    }
  }, [intensity, intensityInput]);

  function handlePointerEnter() {
    if (hoveredInput?.type === StateMachineInputType.Boolean) {
      hoveredInput.value = true;
    }

    if (blinkInput?.type === StateMachineInputType.Trigger) {
      blinkInput.fire();
    }
  }

  function handlePointerLeave() {
    if (hoveredInput?.type === StateMachineInputType.Boolean) {
      hoveredInput.value = false;
    }
  }

  return (
    <span
      className={cn(
        "nexo-rive-mascot",
        hasLoaded && !loadFailed && "nexo-rive-mascot--ready",
        loadFailed && "nexo-rive-mascot--fallback",
        className
      )}
      style={style}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : ariaLabel}
      role={decorative ? undefined : "img"}
    >
      {(!hasLoaded || loadFailed) && (
        <span className="nexo-rive-mascot__fallback">{fallback}</span>
      )}
      {!loadFailed && (
        <RiveComponent
          className="nexo-rive-mascot__canvas"
          aria-hidden="true"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerEnter}
        />
      )}
    </span>
  );
}
