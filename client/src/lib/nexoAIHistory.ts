const AI_CONVERSATION_STORAGE_PREFIX = "nexo:ai:v2:conversations";
const AI_LEGACY_SESSION_STORAGE_PREFIX = "nexo:ai:v2:session";

export const NEXO_AI_HISTORY_CLEARED_EVENT = "nexo:ai:history-cleared";
export const NEXO_AI_PREFERENCES_CHANGED_EVENT = "nexo:ai:preferences-changed";
export const NEXO_AI_UI_PREFERENCES_STORAGE_KEY = "nexo:ai:ui-preferences";

export type NexoAIUIPreferences = {
  showStructuredInsights: boolean;
  showSuggestionChips: boolean;
};

export const DEFAULT_NEXO_AI_UI_PREFERENCES: NexoAIUIPreferences = {
  showStructuredInsights: true,
  showSuggestionChips: true,
};

export function sanitizeNexoAIStorageScopeId(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:_-]/g, "_");
  return normalized || "anonymous";
}

export function readNexoAIPreferences(): NexoAIUIPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_NEXO_AI_UI_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(NEXO_AI_UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_NEXO_AI_UI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NexoAIUIPreferences>;

    return {
      showStructuredInsights:
        parsed.showStructuredInsights ??
        DEFAULT_NEXO_AI_UI_PREFERENCES.showStructuredInsights,
      showSuggestionChips:
        parsed.showSuggestionChips ??
        DEFAULT_NEXO_AI_UI_PREFERENCES.showSuggestionChips,
    };
  } catch {
    return DEFAULT_NEXO_AI_UI_PREFERENCES;
  }
}

export function writeNexoAIPreferences(preferences: NexoAIUIPreferences) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    NEXO_AI_UI_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
  window.dispatchEvent(
    new CustomEvent<NexoAIUIPreferences>(
      NEXO_AI_PREFERENCES_CHANGED_EVENT,
      { detail: preferences }
    )
  );
}

export function clearNexoAIHistory(storageScopeId = "anonymous") {
  if (typeof window === "undefined") return 0;

  const scope = sanitizeNexoAIStorageScopeId(storageScopeId);
  const conversationPrefix = `${AI_CONVERSATION_STORAGE_PREFIX}:${scope}:`;
  const legacyPrefix = `${AI_LEGACY_SESSION_STORAGE_PREFIX}:${scope}:`;
  let removed = 0;

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(conversationPrefix)) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(legacyPrefix)) {
      window.sessionStorage.removeItem(key);
      removed += 1;
    }
  }

  window.dispatchEvent(
    new CustomEvent<{ storageScopeId: string }>(NEXO_AI_HISTORY_CLEARED_EVENT, {
      detail: { storageScopeId: scope },
    })
  );

  return removed;
}
