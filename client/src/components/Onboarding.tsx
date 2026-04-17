import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useFinanceStore } from "@/stores/useFinanceStore";
import { formatMonthYear } from "@/lib/formatters";
import { BRAND_NAME } from "@/lib/branding";
import { BrandLogo } from "./BrandLogo";

export function Onboarding() {
  const { currentMonthId, setIncome, completeOnboarding, initMonth } =
    useFinanceStore();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    const value = parseFloat(
      inputValue.replace(/[^\d.,]/g, "").replace(",", ".")
    );
    if (value > 0) {
      initMonth(currentMonthId);
      setIncome(value);
      completeOnboarding();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleSubmit();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(https://d2xsxph8kpxj0f.cloudfront.net/310419663029060724/aggEn83aN4BBeDW87zXfDe/nexo-hero-bg-aaDiC7fGHnv6EPxEBN6wN9.webp)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-md flex-col items-center px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <BrandLogo alt={BRAND_NAME} className="h-24 w-24" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="nexo-label mb-4 flex items-center gap-2"
        >
          <span>Início</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{formatMonthYear(currentMonthId)}</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Qual é a sua receita?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-10 mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground"
        >
          Todo real recebe uma missão.
          <br />
          Informe sua receita para começar a distribuir.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex w-full max-w-sm items-center gap-2"
        >
          <div
            className={`relative flex-1 rounded-lg border transition-all duration-200 ${
              isFocused
                ? "border-foreground/30 bg-card"
                : "border-border bg-card/50"
            }`}
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="w-full bg-transparent px-4 py-4 pl-11 text-lg font-mono text-foreground outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputValue || parseFloat(inputValue.replace(",", ".")) <= 0}
            className="flex h-[56px] w-[56px] items-center justify-center rounded-lg bg-foreground text-background transition-all duration-200 hover:bg-foreground/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
