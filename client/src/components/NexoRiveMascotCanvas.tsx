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
  toNexoRiveInputValue,
  type NexoBrainRiveState,
} from "@shared/riveState";
import {
  NEXO_AI_MOTION_MANIFEST,
  type NexoAIMascotMood,
} from "@/lib/nexoAIMotion";
import { resolveNexoMascotMood } from "@/lib/mascotMotion";
import type { NexoRiveMascotCanvasProps } from "./NexoRiveMascot";

function resolveMascotMood(state: NexoAIMascotMood): NexoBrainRiveState {
  return resolveNexoMascotMood(state);
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
  const moodInputValue = toNexoRiveInputValue(mood);
  const fallbackAnimation = NEXO_AI_MOTION_MANIFEST.rive.animations[mood];
  const style = {
    "--cube-size": `${size}px`,
  } as CSSProperties & Record<"--cube-size", string>;
  const layout = useMemo(
    () => new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    []
  );

  const { rive, RiveComponent } = useRive({
    src: riveSrc,
    animations: stateMachine ? undefined : fallbackAnimation,
    stateMachines: stateMachine ?? undefined,
    autoplay: true,
    layout,
    useOffscreenRenderer: false,
    automaticallyHandleEvents: false,
    onLoad: () => {
      setHasLoaded(true);
      setLoadFailed(false);
    },
    onLoadError: () => {
      setLoadFailed(true);
      setHasLoaded(false);
    },
  }, {
    useOffscreenRenderer: false,
    shouldResizeCanvasToContainer: true,
  });

  const moodInput = useStateMachineInput(
    rive,
    stateMachine ?? "",
    NEXO_AI_MOTION_MANIFEST.rive.inputs.mood,
    moodInputValue
  );
  const intensityInput = useStateMachineInput(
    rive,
    stateMachine ?? "",
    NEXO_AI_MOTION_MANIFEST.rive.inputs.intensity,
    intensity === "hero" ? 1 : 0
  );
  const hoveredInput = useStateMachineInput(
    rive,
    stateMachine ?? "",
    NEXO_AI_MOTION_MANIFEST.rive.inputs.hovered,
    false
  );
  const blinkInput = useStateMachineInput(
    rive,
    stateMachine ?? "",
    NEXO_AI_MOTION_MANIFEST.rive.inputs.blink
  );

  useEffect(() => {
    if (!rive || stateMachine) return;

    const animation = rive.animationNames.includes(fallbackAnimation)
      ? fallbackAnimation
      : NEXO_AI_MOTION_MANIFEST.rive.animations.idle;

    rive.stop();
    rive.play(animation, true);
  }, [fallbackAnimation, rive, stateMachine]);

  useEffect(() => {
    if (moodInput?.type === StateMachineInputType.Number) {
      // Later NEXO_StateMachine will read this Number input to drive the cube reaction.
      moodInput.value = moodInputValue;
    }
  }, [moodInput, moodInputValue]);

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
          style={{ background: "transparent", backgroundColor: "transparent" }}
          aria-hidden="true"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerEnter}
        />
      )}
    </span>
  );
}
