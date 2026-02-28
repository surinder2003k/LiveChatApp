"use client";

import { motion } from "framer-motion";

export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground/80 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  );
}

