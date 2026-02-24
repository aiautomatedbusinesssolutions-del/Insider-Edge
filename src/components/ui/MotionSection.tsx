"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface MotionSectionProps {
  delay?: number;
  className?: string;
  children: ReactNode;
}

export default function MotionSection({
  delay = 0,
  className,
  children,
}: MotionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
