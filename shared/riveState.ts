export const NEXO_BRAIN_RIVE_STATES = [
  "idle",
  "processing",
  "responding",
  "alert",
  "reading",
  "surprised",
  "confident",
] as const;

export type NexoBrainRiveState = (typeof NEXO_BRAIN_RIVE_STATES)[number];

// This numeric contract is the bridge for the future Rive NEXO_StateMachine.
// The exported .riv should expose a Number input that uses these exact values.
export const NEXO_BRAIN_RIVE_STATE_INPUT_VALUES = {
  idle: 0,
  processing: 1,
  responding: 2,
  alert: 3,
  reading: 4,
  surprised: 5,
  confident: 6,
} as const satisfies Record<NexoBrainRiveState, number>;

export const DEFAULT_NEXO_BRAIN_RIVE_STATE =
  "idle" satisfies NexoBrainRiveState;

export function isNexoBrainRiveState(
  value: unknown
): value is NexoBrainRiveState {
  return (
    typeof value === "string" &&
    NEXO_BRAIN_RIVE_STATES.includes(value as NexoBrainRiveState)
  );
}

export function normalizeNexoBrainRiveState(
  value: unknown
): NexoBrainRiveState {
  return isNexoBrainRiveState(value)
    ? value
    : DEFAULT_NEXO_BRAIN_RIVE_STATE;
}

export function toNexoRiveInputValue(value: unknown): number {
  return NEXO_BRAIN_RIVE_STATE_INPUT_VALUES[
    normalizeNexoBrainRiveState(value)
  ];
}
