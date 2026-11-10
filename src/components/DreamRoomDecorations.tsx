
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

import {
  getRewards,
  subscribeToRewards,
} from "../lib/rewards";

import "./DreamRoomDecorations.css";

type DecorationId =
  | "room-moon-lamp"
  | "room-fairy-lights"
  | "room-plant";

const decorationNames: Record<DecorationId, string> = {
  "room-moon-lamp": "Magical Moon Lamp",
  "room-fairy-lights": "Twinkling Fairy Lights",
  "room-plant": "Cozy Desk Plant",
};

function isDecoration(
  value: string | null
): value is DecorationId {
  return (
    value === "room-moon-lamp" ||
    value === "room-fairy-lights" ||
    value === "room-plant"
  );
}

export default function DreamRoomDecorations() {
  const reducedMotion = useReducedMotion();

  const [equipped, setEquipped] = useState<string | null>(
    () => getRewards().equipped.room
  );

  useEffect(() => {
    const refresh = () => {
      setEquipped(getRewards().equipped.room);
    };

    refresh();

    const unsubscribe = subscribeToRewards(refresh);

    window.addEventListener("focus", refresh);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const moonLamp = equipped === "room-moon-lamp";
  const fairyLights = equipped === "room-fairy-lights";
  const cozyPlant = equipped === "room-plant";

  return (
    <section
      className="dream-decorations"
      aria-label="Magical Study Room decorations"
    >
      <div className="dream-decorations-header">
        <div>
          <span className="dream-decorations-eyebrow">
            YOUR MAGICAL SPACE
          </span>

          <h3>
            Dream Room <Sparkles size={17} />
          </h3>

          <p>
            Make your study corner feel like home.
          </p>
        </div>

        <a
          className="dream-decorations-shop-link"
          href="/rewards"
        >
          🎁 Decorate
        </a>
      </div>

      <div className="dream-decorations-scene">
        <div className="dream-decorations-wall" />

        <div className="dream-decorations-window">
          <span className="dream-window-moon">☾</span>
          <span className="dream-window-star dream-star-one">✦</span>
          <span className="dream-window-star dream-star-two">✧</span>
          <span className="dream-window-star dream-star-three">✦</span>
        </div>

        <div className="dream-decorations-shelf">
          <span>📚</span>
          <span>🧸</span>
          <span>📖</span>
        </div>

        {fairyLights && (
          <div
            className="dream-fairy-lights"
            aria-label="Equipped fairy lights"
          >
            <div className="dream-fairy-wire" />

            {Array.from({ length: 9 }, (_, index) => (
              <motion.span
                key={index}
                className="dream-fairy-bulb"
                style={{
                  left: `${8 + index * 10.5}%`,
                  top: `${18 + Math.sin(index * 0.8) * 10}px`,
                }}
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        opacity: [0.45, 1, 0.45],
                        scale: [0.8, 1.2, 0.8],
                      }
                }
                transition={{
                  duration: 1.8,
                  delay: index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        <div className="dream-decorations-desk">
          <div className="dream-desk-top" />
          <div className="dream-desk-leg dream-desk-leg-left" />
          <div className="dream-desk-leg dream-desk-leg-right" />

          <div className="dream-desk-book">
            📖
          </div>

          <div className="dream-desk-cup">
            ☕
          </div>

          {moonLamp && (
            <motion.div
              className="dream-moon-lamp"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{ duration: 0.5 }}
              aria-label="Equipped moon lamp"
            >
              <motion.div
                className="dream-moon-glow"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        opacity: [0.45, 0.9, 0.45],
                        scale: [0.95, 1.12, 0.95],
                      }
                }
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <span className="dream-moon-symbol">
                🌙
              </span>

              <span className="dream-moon-base" />
            </motion.div>
          )}

          {cozyPlant && (
            <motion.div
              className="dream-cozy-plant"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              aria-label="Equipped cozy plant"
            >
              <motion.span
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        rotate: [-5, 5, -5],
                      }
                }
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                🪴
              </motion.span>
            </motion.div>
          )}
        </div>

        <div className="dream-decorations-rug" />

        <div className="dream-decorations-label">
          {isDecoration(equipped)
            ? `✨ ${decorationNames[equipped]} equipped`
            : "🌙 Your cozy little corner"}
        </div>
      </div>

      <div className="dream-decorations-footer">
        <span>
          {equipped
            ? "Your magical decoration is ready!"
            : "Unlock decorations with your study stars."}
        </span>

        <span>✨</span>
      </div>
    </section>
  );
}
