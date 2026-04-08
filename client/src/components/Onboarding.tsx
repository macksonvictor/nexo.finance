// NEXO – Vault Architecture: Onboarding screen
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { formatMonthYear } from '@/lib/formatters';

export function Onboarding() {
  const { currentMonthId, setIncome, completeOnboarding, initMonth } = useFinanceStore();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    const value = parseFloat(inputValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (value > 0) {
      initMonth(currentMonthId);
      setIncome(value);
      completeOnboarding();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const formatInputDisplay = (val: string) => {
    const num = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(num) || val === '') return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310419663029060724/aggEn83aN4BBeDW87zXfDe/nexo-hero-bg-aaDiC7fGHnv6EPxEBN6wN9.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-md px-6"
      >
        {/* Logo */}
        <motion.img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029060724/aggEn83aN4BBeDW87zXfDe/nexo-logo_e6d80dd3.png"
          alt="NEXO"
          className="w-16 h-16 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="nexo-label mb-4 flex items-center gap-2"
        >
          <span>Início</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="capitalize">{formatMonthYear(currentMonthId)}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3"
        >
          Qual é sua receita?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground mb-10 leading-relaxed max-w-xs"
        >
          Todo real recebe uma missão.
          <br />
          Informe sua receita para começar a distribuir.
        </motion.p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex items-center gap-2 w-full max-w-sm"
        >
          <div
            className={`flex-1 relative rounded-lg border transition-all duration-200 ${
              isFocused
                ? 'border-foreground/30 bg-card'
                : 'border-border bg-card/50'
            }`}
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                // Keep the value as-is, just validate
              }}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="w-full bg-transparent pl-11 pr-4 py-4 text-lg font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!inputValue || parseFloat(inputValue.replace(',', '.')) <= 0}
            className="h-[56px] w-[56px] rounded-lg bg-foreground text-background flex items-center justify-center transition-all duration-200 hover:bg-foreground/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
