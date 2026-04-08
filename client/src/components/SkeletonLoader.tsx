import { motion } from 'framer-motion';

export function SkeletonLoader({ count = 1, type = 'card' }: { count?: number; type?: 'card' | 'text' | 'circle' }) {
  const variants = {
    shimmer: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    },
  };

  const baseClass = 'bg-gradient-to-r from-[#1A1A1A] via-[#2E2E2E] to-[#1A1A1A] bg-[length:200%_100%]';

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate="shimmer"
          variants={variants}
          className={`
            ${baseClass}
            ${type === 'card' ? 'h-32 rounded-xl' : type === 'text' ? 'h-4 rounded-lg w-3/4' : 'h-12 w-12 rounded-full'}
          `}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear' as const,
        }}
          className="bg-gradient-to-r from-[#1A1A1A] via-[#2E2E2E] to-[#1A1A1A] bg-[length:200%_100%] h-64 rounded-xl"
        />
      ))}
    </div>
  );
}

export function SkeletonChatMessage() {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear' as const,
      }}
      className="bg-gradient-to-r from-[#1A1A1A] via-[#2E2E2E] to-[#1A1A1A] bg-[length:200%_100%] h-20 rounded-xl max-w-xs"
    />
  );
}
