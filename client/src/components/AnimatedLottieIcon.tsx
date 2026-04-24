import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { NexoLottieAnimation } from "@/lib/lottieAnimations";

interface AnimatedLottieIconProps {
  animationData: NexoLottieAnimation;
  size?: number;
  visualSize?: number;
  active?: boolean;
  className?: string;
  contentScale?: number;
  restFrame?: number;
  fallback?: ReactNode;
  playKey?: string | number;
  speed?: number;
  durationMs?: number;
  tintMode?: "auto" | "none";
  tintVariant?: "solid" | "outlined";
}

function getAnimationDurationMs(
  animationData: NexoLottieAnimation,
  speed: number
) {
  const candidate = animationData as {
    fr?: number;
    ip?: number;
    op?: number;
  };

  const frameRate =
    typeof candidate.fr === "number" && candidate.fr > 0 ? candidate.fr : null;
  const inPoint =
    typeof candidate.ip === "number" ? candidate.ip : null;
  const outPoint =
    typeof candidate.op === "number" ? candidate.op : null;

  if (
    frameRate === null ||
    inPoint === null ||
    outPoint === null ||
    outPoint <= inPoint
  ) {
    return 900;
  }

  const safeSpeed = Math.max(speed, 0.01);
  return ((outPoint - inPoint) / frameRate) * 1000 / safeSpeed;
}

function getSafeRestFrame(animationData: NexoLottieAnimation, restFrame: number) {
  const candidate = animationData as {
    ip?: number;
    op?: number;
  };
  const inPoint = typeof candidate.ip === "number" ? candidate.ip : null;
  const outPoint = typeof candidate.op === "number" ? candidate.op : null;

  if (inPoint === null || outPoint === null || outPoint <= inPoint) {
    return restFrame;
  }

  return Math.max(inPoint, Math.min(restFrame, outPoint - 1));
}

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function parseCssRgb(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    const oklchMatch = color.match(/oklch\(([^)]+)\)/i);
    if (!oklchMatch) return null;

    const [lightnessRaw, chromaRaw, hueRaw = "0"] = oklchMatch[1]
      .replace(/\//g, " ")
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!lightnessRaw || !chromaRaw) return null;

    const lightness = lightnessRaw.endsWith("%")
      ? Number(lightnessRaw.slice(0, -1)) / 100
      : Number(lightnessRaw);
    const chroma = Number(chromaRaw);
    const hue = Number(hueRaw.replace("deg", ""));

    if ([lightness, chroma, hue].some((value) => Number.isNaN(value))) {
      return null;
    }

    const hueRadians = (hue * Math.PI) / 180;
    const okA = chroma * Math.cos(hueRadians);
    const okB = chroma * Math.sin(hueRadians);
    const lPrime = lightness + 0.3963377774 * okA + 0.2158037573 * okB;
    const mPrime = lightness - 0.1055613458 * okA - 0.0638541728 * okB;
    const sPrime = lightness - 0.0894841775 * okA - 1.291485548 * okB;
    const l = lPrime ** 3;
    const m = mPrime ** 3;
    const s = sPrime ** 3;

    const encode = (linear: number) => {
      const value =
        linear <= 0.0031308
          ? 12.92 * linear
          : 1.055 * linear ** (1 / 2.4) - 0.055;
      return Math.max(0, Math.min(1, value));
    };

    return [
      encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
  }

  const values = match[1]
    .replace(/\//g, " ")
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map(Number);

  if (values.length < 3 || values.some((value) => Number.isNaN(value))) {
    return null;
  }

  return [
    Math.max(0, Math.min(1, values[0] / 255)),
    Math.max(0, Math.min(1, values[1] / 255)),
    Math.max(0, Math.min(1, values[2] / 255)),
  ];
}

function isColorArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.slice(0, 3).every((item) => typeof item === "number")
  );
}

function applyColorToArray(
  value: number[],
  color: [number, number, number]
) {
  return [color[0], color[1], color[2], value[3] ?? 1];
}

function tintLottieColorProperty(
  value: unknown,
  color: [number, number, number]
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = { ...source };

  if (isColorArray(source.k)) {
    output.k = applyColorToArray(source.k, color);
    return output;
  }

  if (Array.isArray(source.k)) {
    output.k = source.k.map((keyframe) => {
      if (!keyframe || typeof keyframe !== "object" || Array.isArray(keyframe)) {
        return keyframe;
      }

      const frame = { ...(keyframe as Record<string, unknown>) };

      if (isColorArray(frame.s)) {
        frame.s = applyColorToArray(frame.s, color);
      }

      if (isColorArray(frame.e)) {
        frame.e = applyColorToArray(frame.e, color);
      }

      return frame;
    });
  }

  return output;
}

function transformLottieNumberProperty(
  value: unknown,
  transform: (numberValue: number) => number
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = { ...source };

  if (typeof source.k === "number") {
    output.k = transform(source.k);
    return output;
  }

  if (Array.isArray(source.k)) {
    output.k = source.k.map((keyframe) => {
      if (!keyframe || typeof keyframe !== "object" || Array.isArray(keyframe)) {
        return keyframe;
      }

      const frame = { ...(keyframe as Record<string, unknown>) };

      if (typeof frame.s === "number") {
        frame.s = transform(frame.s);
      }

      if (typeof frame.e === "number") {
        frame.e = transform(frame.e);
      }

      return frame;
    });
  }

  return output;
}

function softenFillOpacity(value: unknown) {
  return transformLottieNumberProperty(value, (numberValue) =>
    Math.min(numberValue, 58)
  );
}

function strengthenStrokeWidth(value: unknown) {
  return transformLottieNumberProperty(value, (numberValue) =>
    Math.max(numberValue, numberValue * 1.14)
  );
}

function tintGradientStops(
  value: number[],
  color: [number, number, number]
) {
  const output = [...value];

  for (let index = 0; index + 3 < output.length; index += 4) {
    output[index + 1] = color[0];
    output[index + 2] = color[1];
    output[index + 3] = color[2];
  }

  return output;
}

function tintLottieGradientProperty(
  value: unknown,
  color: [number, number, number]
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => tintLottieGradientProperty(item, color));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] =
      key === "k" &&
      Array.isArray(child) &&
      child.every((item) => typeof item === "number")
        ? tintGradientStops(child, color)
        : tintLottieGradientProperty(child, color);
  }

  return output;
}

function tintLottieNode(
  value: unknown,
  color: [number, number, number],
  tintVariant: AnimatedLottieIconProps["tintVariant"]
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => tintLottieNode(item, color, tintVariant));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const output: Record<string, unknown> = {};
  const source = value as Record<string, unknown>;
  const nodeType = source.ty;

  for (const [key, child] of Object.entries(source)) {
    output[key] =
      key === "c"
        ? tintLottieColorProperty(child, color)
        : tintVariant === "outlined" && nodeType === "fl" && key === "o"
        ? softenFillOpacity(child)
        : tintVariant === "outlined" && nodeType === "st" && key === "w"
        ? strengthenStrokeWidth(child)
        : key === "g"
        ? tintLottieGradientProperty(child, color)
        : tintLottieNode(child, color, tintVariant);
  }

  return output;
}

function tintLottieAnimation(
  animationData: NexoLottieAnimation,
  color: [number, number, number],
  tintVariant: AnimatedLottieIconProps["tintVariant"]
) {
  return tintLottieNode(animationData, color, tintVariant) as NexoLottieAnimation;
}

export function AnimatedLottieIcon({
  animationData,
  size = 18,
  visualSize,
  active = false,
  className,
  contentScale = 1,
  restFrame = 0,
  fallback,
  playKey,
  speed = 1.25,
  durationMs,
  tintMode = "auto",
  tintVariant = "solid",
}: AnimatedLottieIconProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const tintColorRef = useRef<string | null>(null);
  const playKeyRef = useRef<string | number | undefined>(playKey);
  const [isAnimating, setIsAnimating] = useState(false);
  const [resolvedAnimationData, setResolvedAnimationData] =
    useState<NexoLottieAnimation>(animationData);
  const resolvedVisualSize = visualSize ?? size;

  const reset = useCallback(() => {
    lottieRef.current?.goToAndStop(
      getSafeRestFrame(animationData, restFrame),
      true
    );
  }, [animationData, restFrame]);

  const clearAnimationTimer = useCallback(() => {
    if (timeoutRef.current === null) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const stopPreview = useCallback(() => {
    clearAnimationTimer();
    setIsAnimating(false);
    reset();
  }, [clearAnimationTimer, reset]);

  const syncTint = useCallback(() => {
    if (tintMode === "none") {
      setResolvedAnimationData(animationData);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const cssColor = window.getComputedStyle(element).color;
    if (tintColorRef.current === cssColor) return;

    const parsedColor = parseCssRgb(cssColor);
    if (!parsedColor) return;

    tintColorRef.current = cssColor;
    setResolvedAnimationData(
      tintLottieAnimation(animationData, parsedColor, tintVariant)
    );
  }, [animationData, tintMode, tintVariant]);

  const play = useCallback(() => {
    if (shouldReduceMotion()) {
      stopPreview();
      return;
    }

    syncTint();
    clearAnimationTimer();
    setIsAnimating(true);

    const player = lottieRef.current;
    const playbackDurationMs =
      durationMs ?? getAnimationDurationMs(animationData, speed);

    if (!player) {
      timeoutRef.current = window.setTimeout(stopPreview, playbackDurationMs);
      return;
    }

    player.setSpeed(speed);
    player.stop();
    player.goToAndPlay(0, true);
    timeoutRef.current = window.setTimeout(stopPreview, playbackDurationMs);
  }, [animationData, clearAnimationTimer, durationMs, speed, stopPreview, syncTint]);

  useEffect(() => {
    tintColorRef.current = null;
    if (tintMode === "none") {
      setResolvedAnimationData(animationData);
    }
  }, [animationData, tintMode]);

  useLayoutEffect(() => {
    tintColorRef.current = null;
    syncTint();
  }, [animationData, syncTint]);

  useLayoutEffect(() => {
    syncTint();
  }, [active, syncTint]);

  useEffect(() => {
    if (isAnimating) return;

    const animationFrame = window.requestAnimationFrame(reset);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [isAnimating, reset, resolvedAnimationData]);

  useEffect(() => {
    if (active) {
      play();
      return;
    }

    stopPreview();
  }, [active, play, stopPreview]);

  useEffect(() => {
    if (playKey === undefined || Object.is(playKeyRef.current, playKey)) {
      playKeyRef.current = playKey;
      return;
    }

    playKeyRef.current = playKey;
    play();
  }, [playKey, play]);

  useEffect(() => () => clearAnimationTimer(), [clearAnimationTimer]);

  return (
    <span
      ref={containerRef}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
      onPointerEnter={play}
      onPointerDown={play}
      onFocus={play}
      onBlur={stopPreview}
    >
      {fallback && (
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 flex items-center justify-center text-current transition-opacity duration-150",
            isAnimating ? "opacity-0" : "opacity-100"
          )}
          style={{
            width: resolvedVisualSize,
            height: resolvedVisualSize,
            transform: `translate(-50%, -50%) scale(${contentScale})`,
          }}
        >
          {fallback}
        </span>
      )}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 flex items-center justify-center transition-opacity duration-150",
          isAnimating || !fallback ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: resolvedVisualSize,
          height: resolvedVisualSize,
          transform: `translate(-50%, -50%) scale(${contentScale})`,
        }}
      >
        <Lottie
          animationData={resolvedAnimationData}
          autoplay={false}
          loop={false}
          lottieRef={lottieRef}
          onDOMLoaded={reset}
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          style={{ width: resolvedVisualSize, height: resolvedVisualSize }}
        />
      </span>
    </span>
  );
}
