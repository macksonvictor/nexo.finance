import { describe, expect, it } from "vitest";
import {
  NEXO_BRAIN_RIVE_STATE_INPUT_VALUES,
  normalizeNexoBrainRiveState,
  toNexoRiveInputValue,
} from "@shared/riveState";

describe("NEXO Rive state mapping", () => {
  it("keeps the Python Core state contract aligned with Rive inputs", () => {
    expect(NEXO_BRAIN_RIVE_STATE_INPUT_VALUES).toEqual({
      idle: 0,
      processing: 1,
      responding: 2,
      alert: 3,
      reading: 4,
      surprised: 5,
      confident: 6,
    });
  });

  it("normalizes valid states", () => {
    expect(normalizeNexoBrainRiveState("alert")).toBe("alert");
    expect(normalizeNexoBrainRiveState("confident")).toBe("confident");
  });

  it("falls back to idle for invalid states", () => {
    expect(normalizeNexoBrainRiveState("curious")).toBe("idle");
    expect(toNexoRiveInputValue("curious")).toBe(0);
    expect(toNexoRiveInputValue(null)).toBe(0);
    expect(toNexoRiveInputValue(undefined)).toBe(0);
  });
});
