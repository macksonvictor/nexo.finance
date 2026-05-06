import {
  toNexoRiveInputValue,
  type NexoBrainRiveState,
} from "@shared/riveState";

export type NexoMascotAlias =
  | "curious"
  | "thinking"
  | "speaking"
  | "listening";

export type NexoMascotMood = NexoBrainRiveState | NexoMascotAlias;

export type NexoMascotLottieTimeline =
  | "idle"
  | "yes"
  | "no"
  | "alert"
  | "thinking"
  | "jump";

export type NexoMascotMotionSpec = {
  timeline: NexoMascotLottieTimeline;
  segment: readonly [number, number];
  loop: boolean;
  speed: number;
  riveInputValue: number;
};

export const NEXO_MASCOT_ALIAS_STATE = {
  curious: "surprised",
  thinking: "processing",
  speaking: "responding",
  listening: "idle",
} satisfies Record<NexoMascotAlias, NexoBrainRiveState>;

export const NEXO_MASCOT_LOTTIE_TIMELINES = {
  // Original idle marker from the exported Lottie: preserves the native dark-mode rim.
  idle: [0, 29],
  yes: [31, 105],
  no: [106, 180],
  alert: [181, 270],
  thinking: [271, 390],
  jump: [391, 479],
} as const satisfies Record<NexoMascotLottieTimeline, readonly [number, number]>;

export const NEXO_MASCOT_STATE_TIMELINES = {
  idle: "idle",
  reading: "thinking",
  processing: "thinking",
  responding: "yes",
  alert: "alert",
  surprised: "no",
  confident: "yes",
} as const satisfies Record<NexoBrainRiveState, NexoMascotLottieTimeline>;

export const NEXO_MASCOT_STATE_LOOPS = {
  idle: true,
  reading: true,
  processing: true,
  responding: true,
  alert: false,
  surprised: false,
  confident: false,
} as const satisfies Record<NexoBrainRiveState, boolean>;

export const NEXO_MASCOT_STATE_SPEEDS = {
  idle: 0.04,
  reading: 0.82,
  processing: 0.82,
  responding: 0.9,
  alert: 1,
  surprised: 1,
  confident: 1,
} as const satisfies Record<NexoBrainRiveState, number>;

export const NEXO_MASCOT_INTERACTION_MOTION = {
  celebrate: {
    timeline: "jump",
    segment: NEXO_MASCOT_LOTTIE_TIMELINES.jump,
    loop: false,
    speed: 1,
  },
  pressConfirm: {
    timeline: "yes",
    segment: NEXO_MASCOT_LOTTIE_TIMELINES.yes,
    loop: false,
    speed: 1,
  },
} as const;

export function resolveNexoMascotMood(
  state: NexoMascotMood
): NexoBrainRiveState {
  if (
    state === "curious" ||
    state === "thinking" ||
    state === "speaking" ||
    state === "listening"
  ) {
    return NEXO_MASCOT_ALIAS_STATE[state];
  }

  return state;
}

export function resolveNexoMascotMotion(
  state: NexoMascotMood
): NexoMascotMotionSpec {
  const mood = resolveNexoMascotMood(state);
  const timeline = NEXO_MASCOT_STATE_TIMELINES[mood];

  return {
    timeline,
    segment: NEXO_MASCOT_LOTTIE_TIMELINES[timeline],
    loop: NEXO_MASCOT_STATE_LOOPS[mood],
    speed: NEXO_MASCOT_STATE_SPEEDS[mood],
    riveInputValue: toNexoRiveInputValue(mood),
  };
}
