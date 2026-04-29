export type NexoLanguage = "pt-BR" | "en-US" | "es-ES";

export const LANGUAGE_STORAGE_KEY = "nexo:language";
export const LANGUAGE_CHANGE_EVENT = "nexo:language-change";

export const LANGUAGE_OPTIONS: Array<{
  id: NexoLanguage;
  label: string;
  shortLabel: string;
  activeLabel: string;
  readyLabel: string;
}> = [
  {
    id: "pt-BR",
    label: "Português (Brasil)",
    shortLabel: "Português",
    activeLabel: "Ativo",
    readyLabel: "Interface pronta",
  },
  {
    id: "en-US",
    label: "English",
    shortLabel: "English",
    activeLabel: "Active",
    readyLabel: "Interface ready",
  },
  {
    id: "es-ES",
    label: "Español",
    shortLabel: "Español",
    activeLabel: "Activo",
    readyLabel: "Interfaz lista",
  },
];

export function normalizeLanguage(language: string | null | undefined): NexoLanguage {
  if (language === "en-US" || language === "es-ES") return language;
  return "pt-BR";
}

export function getStoredLanguage(): NexoLanguage {
  if (typeof window === "undefined") return "pt-BR";
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function applyDocumentLanguage(language: NexoLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
}

export function setStoredLanguage(language: string): NexoLanguage {
  const nextLanguage = normalizeLanguage(language);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_CHANGE_EVENT, {
        detail: { language: nextLanguage },
      })
    );
  }

  applyDocumentLanguage(nextLanguage);
  return nextLanguage;
}
