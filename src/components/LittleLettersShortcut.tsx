
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import "./LittleLettersShortcut.css";

export default function LittleLettersShortcut() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="little-letters-shortcut"
      animate={
        reducedMotion
          ? undefined
          : {
              y: [0, -8, 0],
            }
      }
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Link
        to="/little-letters"
        className="little-letters-shortcut-link"
        aria-label="Open Little Letters postcard garden"
        title="Little Letters — a little message for you"
      >
        <span aria-hidden="true">💌</span>
        <span className="little-letters-shortcut-sparkle">
          ✨
        </span>
      </Link>
    </motion.div>
  );
}
