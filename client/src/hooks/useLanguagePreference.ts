import { useEffect, useState } from "react";
import {
  applyDocumentLanguage,
  getStoredLanguage,
  LANGUAGE_CHANGE_EVENT,
  normalizeLanguage,
  setStoredLanguage,
  type NexoLanguage,
} from "@/lib/language";

export function useLanguagePreference() {
  const [language, setLanguage] = useState<NexoLanguage>(getStoredLanguage);

  useEffect(() => {
    applyDocumentLanguage(language);

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      setLanguage(normalizeLanguage(customEvent.detail?.language));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "nexo:language") {
        setLanguage(normalizeLanguage(event.newValue));
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [language]);

  const updateLanguage = (nextLanguage: string) => {
    setLanguage(setStoredLanguage(nextLanguage));
  };

  return { language, setLanguage: updateLanguage };
}
