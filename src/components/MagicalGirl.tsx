
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Star } from "lucide-react";

import {
  getRewards,
  subscribeToRewards,
} from "../lib/rewards";

import "./MagicalGirl.css";

export default function MagicalGirl() {
  const reducedMotion = useReducedMotion();

  const [equipped, setEquipped] = useState<string | null>(
    () => getRewards().equipped.girl
  );

  useEffect(() => {
    const refresh = () => {
      setEquipped(getRewards().equipped.girl);
    };

    refresh();

    const unsubscribe = subscribeToRewards(refresh);

    window.addEventListener("focus", refresh);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const headphones = equipped === "girl-headphones";
  const sweater = equipped === "girl-purple-sweater";
  const flower = equipped === "girl-flower";

  const message = headphones
    ? "Music on, worries off! 🎧"
    : sweater
      ? "Cozy and ready to study! 💜"
      : flower
        ? "Let's bloom together! 🌸"
        : "Let's make today magical! ✨";

  return (
    <section className="magical-girl-card">
      {/* HEADER */}
      <div className="magical-girl-header">
        <div>
          <span className="magical-girl-eyebrow">
            YOUR MAGICAL STUDY FRIEND
          </span>

          <h3>
            Meet Lily <Sparkles size={17} />
          </h3>

          <p>Your cozy study companion</p>
        </div>

        <span className="magical-girl-status">
          <Star size={13} fill="currentColor" />
          Study Buddy
        </span>
      </div>

      {/* MAGICAL SCENE */}
      <div className="magical-girl-scene">
        {/* Moon */}
        <div className="magical-girl-moon" />

        {/* Window */}
        <div className="magical-girl-window">
          <span>✦</span>
          <span>☾</span>
          <span>✧</span>
        </div>

        {/* Floating sparkles */}
        <div
          className="magical-girl-sparkles"
          aria-hidden="true"
        >
          ✨ <span>✦</span> ✨
        </div>

        {/* CENTERED CHARACTER WRAPPER */}
        <div className="magical-girl-character-position">
          <motion.div
            className="magical-girl-character"
            animate={
              reducedMotion
                ? undefined
                : {
                    y: [0, -7, 0],
                    rotate: [-1, 1, -1],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* BACK HAIR */}
            <div className="magical-girl-hair-back" />

            {/* BODY */}
            <div className="magical-girl-body">
              <div
                className={`magical-girl-shirt ${
                  sweater ? "is-lavender" : ""
                }`}
              />

              <div className="magical-girl-collar" />
            </div>

            {/* NECK */}
            <div className="magical-girl-neck" />

            {/* HEAD */}
            <div className="magical-girl-head">
              {/* FACE */}
              <div className="magical-girl-face">
                <span className="magical-girl-eye eye-left" />
                <span className="magical-girl-eye eye-right" />

                <span className="magical-girl-blush blush-left" />
                <span className="magical-girl-blush blush-right" />

                <span className="magical-girl-smile" />
              </div>

              {/* HAIR */}
              <div className="magical-girl-bangs" />

              <div className="magical-girl-hair-side hair-left" />
              <div className="magical-girl-hair-side hair-right" />

              {/* HEADPHONES ACCESSORY */}
              {headphones && (
                <motion.div
                  className="magical-girl-headphones"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="headphone-band" />
                  <span className="headphone-ear ear-left" />
                  <span className="headphone-ear ear-right" />
                </motion.div>
              )}

              {/* FLOWER ACCESSORY */}
              {flower && (
                <motion.span
                  className="magical-girl-flower"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={
                    reducedMotion
                      ? {
                          opacity: 1,
                          scale: 1,
                        }
                      : {
                          opacity: 1,
                          scale: 1,
                          rotate: [-10, 10, -10],
                        }
                  }
                  transition={{
                    duration: 3,
                    repeat: reducedMotion ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                  role="img"
                  aria-label="Flower hair clip"
                >
                  🌸
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>

        {/* STUDY DESK */}
        <div className="magical-girl-desk">
          <div className="magical-girl-book">📖</div>
          <div className="magical-girl-cup">☕</div>
        </div>

        {/* ENCOURAGEMENT MESSAGE */}
        <motion.div
          key={message}
          className="magical-girl-message"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
        >
          {message}
        </motion.div>
      </div>

      {/* FOOTER */}
      <div className="magical-girl-footer">
        <span>
          {equipped
            ? "✨ Magical outfit equipped"
            : "🎀 Ready for a makeover"}
        </span>

        <a href="/rewards">
          Dress Up
          <Sparkles size={15} />
        </a>
      </div>
    </section>
  );
}
