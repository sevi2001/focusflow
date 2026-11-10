
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Heart,
  Moon,
  Play,
  Sparkles,
  Sun,
  Pencil,
  Check,
  X,
  BookOpen,
} from "lucide-react";

import "./CatCompanion.css";

type CatMood = "idle" | "happy" | "sleeping" | "playing" | "focused";

const NAME_KEY = "focusflow_cat_name";

const messages: Record<CatMood, string[]> = {
  idle: [
    "Meow! Ready to study together? 🐾",
    "A little progress every day adds up!",
    "I'll keep you company while you work.",
  ],
  happy: [
    "Purr... I love head pats! 💕",
    "You're my favorite human!",
    "That made me so happy! 🐱",
  ],
  sleeping: [
    "Zzz... dreaming of cozy blankets...",
    "Five more minutes... zzz...",
  ],
  playing: [
    "Catch me if you can! 🧶",
    "Zoomies activated!",
    "Playtime makes everything better!",
  ],
  focused: [
    "You can do this! One task at a time.",
    "Stay focused. I'm cheering for you! 📚",
    "Small steps lead to big achievements.",
    "Remember to take breaks and drink water!",
  ],
};

function readCatName() {
  try {
    const stored = localStorage.getItem(NAME_KEY);
    return stored?.trim().slice(0, 24) || "Mochi";
  } catch {
    return "Mochi";
  }
}

function randomMessage(mood: CatMood) {
  const options = messages[mood];
  return options[Math.floor(Math.random() * options.length)];
}

export default function CatCompanion() {
  const [name, setName] = useState(readCatName);
  const [draftName, setDraftName] = useState(name);
  const [editingName, setEditingName] = useState(false);

  const [mood, setMood] = useState<CatMood>("idle");
  const [message, setMessage] = useState(messages.idle[0]);
  const [hearts, setHearts] = useState(0);

  const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const messageIndex = useRef(0);

  // Save the cat's name.
  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      // Storage may be unavailable.
    }
  }, [name]);

  // Clean up pending animations.
  useEffect(() => {
    return () => {
      if (actionTimeout.current) {
        clearTimeout(actionTimeout.current);
      }
    };
  }, []);

  // Periodically encourage the user while focused.
  useEffect(() => {
    if (mood !== "focused") return;

    const interval = window.setInterval(() => {
      messageIndex.current += 1;

      const options = messages.focused;
      setMessage(options[messageIndex.current % options.length]);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [mood]);

  const clearAction = () => {
    if (actionTimeout.current) {
      clearTimeout(actionTimeout.current);
      actionTimeout.current = null;
    }
  };

  const changeMood = (
    nextMood: CatMood,
    duration?: number
  ) => {
    clearAction();

    setMood(nextMood);
    setMessage(randomMessage(nextMood));

    if (duration) {
      actionTimeout.current = setTimeout(() => {
        setMood("idle");
        setMessage(randomMessage("idle"));
      }, duration);
    }
  };

  const petCat = () => {
    if (mood === "sleeping") {
      changeMood("happy", 3500);
      setMessage("Oh! You woke me up! Purr... 💕");
    } else {
      changeMood("happy", 3500);
    }

    setHearts((previous) => previous + 1);
  };

  const playWithCat = () => {
    changeMood("playing", 5000);
  };

  const toggleSleep = () => {
    if (mood === "sleeping") {
      changeMood("idle");
      setMessage("Good morning! Ready for a cozy day? ☀️");
    } else {
      changeMood("sleeping");
    }
  };

  const encourageMe = () => {
    changeMood("focused");
  };

  const saveName = () => {
    const cleanName = draftName.trim().slice(0, 24);

    if (!cleanName) return;

    setName(cleanName);
    setDraftName(cleanName);
    setEditingName(false);
    setMessage(`Meow! My name is ${cleanName}! 🐾`);
  };

  const catAnimation =
    mood === "sleeping"
      ? {
          y: [0, 2, 0],
          rotate: [0, 1, 0],
          scale: [1, 1.02, 1],
        }
      : mood === "playing"
        ? {
            y: [0, -35, 0, -15, 0],
            rotate: [0, -12, 12, -8, 0],
            scale: [1, 1.12, 1, 1.08, 1],
          }
        : mood === "happy"
          ? {
              y: [0, -10, 0],
              rotate: [-5, 5, -5],
              scale: [1, 1.08, 1],
            }
          : mood === "focused"
            ? {
                y: [0, -3, 0],
                rotate: [0, 2, 0],
                scale: [1, 1.02, 1],
              }
            : {
                y: [0, -5, 0],
                rotate: [0, 2, 0],
                scale: [1, 1.02, 1],
              };

  const animationDuration =
    mood === "playing"
      ? 1.1
      : mood === "happy"
        ? 0.7
        : mood === "sleeping"
          ? 3.5
          : 3;

  const moodLabels: Record<CatMood, string> = {
    idle: "Relaxed",
    happy: "Happy",
    sleeping: "Sleeping",
    playing: "Playful",
    focused: "Study Buddy",
  };

  return (
    <section className="cat-companion-panel">
      {/* Header */}
      <div className="cat-panel-header">
        <div className="flex items-center gap-3">
          <div className="cat-header-icon">
            <Heart size={21} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Your Cat Companion
            </h2>

            <p className="text-xs text-slate-400">
              A little friend for your study journey
            </p>
          </div>
        </div>

        <span className="cat-mood-badge">
          {moodLabels[mood]}
        </span>
      </div>

      {/* Name */}
      <div className="cat-name-row">
        {editingName ? (
          <div className="flex w-full flex-wrap gap-2">
            <input
              value={draftName}
              maxLength={24}
              aria-label="Cat name"
              onChange={(event) =>
                setDraftName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") {
                  setEditingName(false);
                }
              }}
              className="cat-name-input"
              autoFocus
            />

            <button
              onClick={saveName}
              aria-label="Save cat name"
              className="cat-name-action"
            >
              <Check size={17} />
            </button>

            <button
              onClick={() => setEditingName(false)}
              aria-label="Cancel editing name"
              className="cat-name-action"
            >
              <X size={17} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-amber-200">
              {name}
            </h3>

            <button
              onClick={() => {
                setDraftName(name);
                setEditingName(true);
              }}
              aria-label="Rename cat"
              className="cat-name-action"
            >
              <Pencil size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Animated cat area */}
      <div className="cat-animation-area">
        <div className="cat-background-glow" />

        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="cat-speech-bubble"
            role="status"
          >
            {message}
          </motion.div>
        </AnimatePresence>

        <div className="cat-character-container">
          {mood === "sleeping" && (
            <motion.span
              className="cat-sleep-symbol"
              animate={{
                y: [0, -22, -42],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
              }}
            >
              Zzz
            </motion.span>
          )}

          <AnimatePresence>
            {mood === "happy" && (
              <motion.div
                key={hearts}
                className="cat-floating-hearts"
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -45, scale: 1.2 }}
                exit={{ opacity: 0, y: -65 }}
                transition={{ duration: 1.2 }}
              >
                💕 💗
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={petCat}
            aria-label={`Pet ${name}`}
            className="cat-character"
            animate={catAnimation}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileTap={{ scale: 0.9 }}
          >
            {mood === "sleeping" ? "😽" : "🐈"}
          </motion.button>

          <div className="cat-shadow" />
        </div>

        <p className="cat-hint">
          Tap the cat to give it a little head pat!
        </p>
      </div>

      {/* Interaction buttons */}
      <div className="cat-actions">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={petCat}
          className="cat-action-button cat-pet-button"
        >
          <Heart size={17} />
          Pet
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={playWithCat}
          className="cat-action-button"
        >
          <Play size={17} />
          Play
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={toggleSleep}
          className="cat-action-button"
        >
          {mood === "sleeping" ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}
          {mood === "sleeping" ? "Wake" : "Sleep"}
        </motion.button>
      </div>

      {/* Study encouragement */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={encourageMe}
        className="cat-encourage-button"
      >
        <BookOpen size={18} />
        Encourage Me
        <Sparkles size={16} />
      </motion.button>

      <p className="mt-4 text-center text-xs text-slate-500">
        Your cozy study buddy is always cheering for you.
      </p>
    </section>
  );
}
