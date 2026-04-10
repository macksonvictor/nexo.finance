import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/branding";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.84 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <img
            src={BRAND_LOGO_SRC}
            alt={BRAND_NAME}
            className="h-44 w-44 object-contain md:h-48 md:w-48"
          />

          <div className="text-center">
            <h1 className="text-[24px] font-semibold uppercase tracking-[0.14em] text-foreground md:text-[30px]">
              {BRAND_NAME}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-2 flex gap-1"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
