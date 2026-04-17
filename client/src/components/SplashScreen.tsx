import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BRAND_NAME } from "@/lib/branding";
import { BrandLogo } from "./BrandLogo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const stageOne = setTimeout(() => setStage(1), 260);
    const stageTwo = setTimeout(() => setStage(2), 880);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 360);
    }, 2350);

    return () => {
      clearTimeout(stageOne);
      clearTimeout(stageTwo);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-[#050505]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(112,255,61,0.08),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />

      <div className="relative flex min-h-screen w-full justify-center px-6">
        <div className="mt-[42vh] flex -translate-y-1/2 flex-col items-center justify-center gap-2 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="flex h-44 w-44 items-center justify-center overflow-hidden md:h-48 md:w-48"
        >
          <BrandLogo
            alt={BRAND_NAME}
            className="h-[300%] w-[300%] max-w-none shrink-0"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 10 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="space-y-2"
        >
          <h1 className="text-[32px] font-semibold tracking-tight text-[#FAFAF7] md:text-[38px]">
            {BRAND_NAME}
          </h1>
          <p className="text-sm text-[#9C9C9C] md:text-base">
            Todo real recebe uma missão.
          </p>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-sm text-[#7E7E7E]"
          >
            Organize o mês atual com clareza desde o primeiro acesso.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 2 ? 1 : 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-2 h-px w-36 overflow-hidden rounded-full bg-[#1B1B1B] md:w-40"
        >
          <motion.div
            className="h-full w-16 bg-gradient-to-r from-transparent via-white to-transparent opacity-75"
            animate={{ x: ["-120%", "240%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
