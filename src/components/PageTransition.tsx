
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import "./PomodoroTimer.css";

type PageTransitionProps = {
  children: ReactNode;
};

export default function PageTransition({
  children,
}: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        reducedMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 1 }
          : { opacity: 0, y: -10 }
      }
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        ease: "easeOut",
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
