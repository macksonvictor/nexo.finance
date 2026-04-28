import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { getAppCopy } from "@/lib/i18n";
import { PlanosView } from "./PlanosView";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { language } = useLanguagePreference();
  const copy = getAppCopy(language);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          <motion.button
            type="button"
            aria-label={language === "en-US" ? "Close plans" : language === "es-ES" ? "Cerrar planes" : "Fechar planos"}
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={`${copy.viewMeta.planos.title} NEXO`}
            className="nexo-shell-float relative flex h-[min(800px,calc(100dvh-96px))] w-[min(1120px,calc(100vw-48px))] flex-col overflow-hidden rounded-[28px]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-7">
              <div className="min-w-0">
                <p className="nexo-label mb-1">{copy.viewMeta.planos.title} NEXO</p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {language === "en-US" ? "Upgrade your plan" : language === "es-ES" ? "Actualiza tu plan" : "Atualize seu plano"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="nexo-shell-control flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground"
                aria-label={language === "en-US" ? "Close plans" : language === "es-ES" ? "Cerrar planes" : "Fechar planos"}
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <PlanosView />
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
