
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Heart, RotateCcw, Copy } from "lucide-react";

import type { LittleLetter } from "../data/littleLetters";

import "./LittleLetterCard.css";

type LittleLetterCardProps = {
  letter: LittleLetter;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export default function LittleLetterCard({
  letter,
  index,
  isFavorite,
  onToggleFavorite,
}: LittleLetterCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const reducedMotion = useReducedMotion();

  const copyMessage = async () => {
    const text = `${letter.greeting}\n\n${letter.message}\n\n— ${letter.signature}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.article
      className="little-letter-floating"
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 35,
              scale: 0.92,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.5,
        delay: reducedMotion ? 0 : index * 0.09,
      }}
    >
      <motion.div
        className="little-letter-drift"
        animate={
          reducedMotion
            ? undefined
            : {
                y: [0, -9, 0],
                rotate: [
                  letter.rotation,
                  letter.rotation + 1.5,
                  letter.rotation,
                ],
              }
        }
        transition={{
          duration: 5 + (index % 3),
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.3,
        }}
        style={
          reducedMotion
            ? { rotate: letter.rotation }
            : undefined
        }
      >
        <div
          className={`little-letter-card theme-${letter.theme}`}
        >
          <div className="little-letter-flip-scene">
            <motion.div
              className="little-letter-flip-inner"
              animate={{
                rotateY: flipped ? 180 : 0,
              }}
              transition={{
                duration: reducedMotion ? 0 : 0.65,
                ease: "easeInOut",
              }}
            >
              {/* FRONT OF POSTCARD */}
              <div className="little-letter-face little-letter-front">
                <div className="little-letter-top">
                  <div className="little-letter-avatar">
                    <span>{letter.emoji}</span>
                  </div>

                  <div className="little-letter-identity">
                    <strong>{letter.sender}</strong>
                    <span>{letter.subtitle}</span>
                  </div>

                  <div className="little-letter-stamp">
                    <span>{letter.stamp}</span>
                    <small>POSTCARD</small>
                  </div>
                </div>

                <div className="little-letter-divider" />

                <div className="little-letter-front-content">
                  <span className="little-letter-mini-title">
                    {letter.title}
                  </span>

                  <p>
                    {letter.message.length > 110
                      ? `${letter.message.slice(0, 110).trimEnd()}…`
                      : letter.message}
                  </p>

                  <span className="little-letter-signature">
                    — {letter.sender} ✦
                  </span>
                </div>

                <div
                  className="little-letter-stickers"
                  aria-hidden="true"
                >
                  {letter.stickers.map((sticker, stickerIndex) => (
                    <span key={`${sticker}-${stickerIndex}`}>
                      {sticker}
                    </span>
                  ))}
                </div>
              </div>

              {/* BACK OF POSTCARD */}
              <div className="little-letter-face little-letter-back">
                <div className="little-letter-back-header">
                  <span>✦ A LITTLE LETTER FOR YOU ✦</span>
                  <span>{letter.stamp}</span>
                </div>

                <div className="little-letter-divider" />

                <div className="little-letter-handwriting">
                  <strong>{letter.greeting}</strong>
                  <p>{letter.message}</p>
                  <span>— {letter.signature}</span>
                </div>

                <div
                  className="little-letter-back-stickers"
                  aria-hidden="true"
                >
                  {letter.stickers.join("  ")}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="little-letter-actions">
            <button
              type="button"
              className="little-letter-open-button"
              onClick={() => setFlipped((previous) => !previous)}
              aria-label={
                flipped
                  ? `Show front of ${letter.title}`
                  : `Read ${letter.title}`
              }
            >
              <RotateCcw size={15} />
              {flipped ? "Front" : "Read letter"}
            </button>

            <button
              type="button"
              className={`little-letter-icon-button ${
                isFavorite ? "is-favorite" : ""
              }`}
              onClick={() => onToggleFavorite(letter.id)}
              aria-label={
                isFavorite
                  ? `Remove ${letter.title} from favorites`
                  : `Save ${letter.title} to favorites`
              }
              aria-pressed={isFavorite}
              title="Favorite"
            >
              <Heart
                size={17}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>

            <button
              type="button"
              className="little-letter-icon-button"
              onClick={copyMessage}
              aria-label={`Copy ${letter.title} message`}
              title="Copy message"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>

          {copied && (
            <span className="little-letter-copied" role="status">
              Message copied! ♡
            </span>
          )}
        </div>
      </motion.div>
    </motion.article>
  );
}
