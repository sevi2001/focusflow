
import { motion, useReducedMotion } from "motion/react";
import { Moon, Sparkles } from "lucide-react";

export default function PageLoader() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0b1020] px-5 text-center text-white"
    >
      <motion.div
        animate={
          reducedMotion
            ? {}
            : {
                y: [0, -10, 0],
                rotate: [-4, 4, -4],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-300/20 bg-amber-300/10"
      >
        <Moon size={44} className="text-amber-200" />

        <Sparkles
          size={18}
          className="absolute -right-2 -top-2 text-amber-300"
        />
      </motion.div>

      <div>
        <h2 className="text-xl font-bold">
          Focus<span className="text-amber-300">Flow</span>
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Preparing your peaceful space...
        </p>
      </div>

      <motion.div
        animate={
          reducedMotion
            ? {}
            : { opacity: [0.3, 1, 0.3] }
        }
        transition={{
          duration: 1.2,
          repeat: Infinity,
        }}
        className="flex gap-2"
        aria-hidden="true"
      >
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className="h-2 w-2 rounded-full bg-amber-300"
          />
        ))}
      </motion.div>

      <span className="sr-only">Loading page</span>
    </div>
  );
}
