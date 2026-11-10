
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import MyLittleNotes from "../components/MyLittleNotes";
import {
  ArrowLeft,
  Heart,
  Mail,
  Sparkles,
  Stars,
} from "lucide-react";

import LittleLetterCard from "../components/LittleLetterCard";

import {
  littleLetters,
} from "../data/littleLetters";

import "./LittleLetters.css";

const FAVORITES_KEY = "focusflow_little_letters_favorites_v1";

type Filter = "all" | "favorites";

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (id): id is string => typeof id === "string"
    );
  } catch {
    return [];
  }
}

export default function LittleLetters() {
  const reducedMotion = useReducedMotion();

  const [favorites, setFavorites] = useState<string[]>(
    loadFavorites
  );

  const [filter, setFilter] = useState<Filter>("all");

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
      );
    } catch {
      // The postcards still work if browser storage is unavailable.
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((favorite) => favorite !== id)
        : [...previous, id]
    );
  };

  const visibleLetters = useMemo(() => {
    if (filter === "favorites") {
      return littleLetters.filter((letter) =>
        favorites.includes(letter.id)
      );
    }

    return littleLetters;
  }, [filter, favorites]);

  return (
    <main className="little-letters-page">
      {/* FLOATING BACKGROUND DECORATIONS */}
      <div
        className="little-letters-background"
        aria-hidden="true"
      >
        <span className="garden-decor decor-one">✦</span>
        <span className="garden-decor decor-two">♡</span>
        <span className="garden-decor decor-three">☁</span>
        <span className="garden-decor decor-four">✧</span>
        <span className="garden-decor decor-five">🌸</span>
        <span className="garden-decor decor-six">✦</span>
      </div>

      <div className="little-letters-container">
        {/* TOP NAVIGATION */}
        <nav
          className="little-letters-nav"
          aria-label="Little Letters navigation"
        >
          <Link
            to="/"
            className="little-letters-back-link"
          >
            <ArrowLeft size={17} />
            Back Home
          </Link>

          <span className="little-letters-nav-brand">
           <Mail size={17} />
            FocusFlow
          </span>
        </nav>

        {/* PAGE HEADING */}
        <motion.header
          className="little-letters-hero"
          initial={
            reducedMotion
              ? false
              : { opacity: 0, y: 20 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="little-letters-eyebrow">
            <Sparkles size={15} />
            A LITTLE MAGIC FOR YOUR DAY
            <Sparkles size={15} />
          </span>

          <div className="little-letters-hero-icon">
            💌
          </div>

          <h1>
            Little <em>Letters</em>
          </h1>

          <p>
            Tiny messages for big dreams.
            <br />
            A floating garden of encouragement,
            sweet thoughts, and little reminders.
          </p>

          <div className="little-letters-hero-tags">
            <span>🎀 Made with love</span>
            <span>🌙 Read at your own pace</span>
            <span>✨ Keep dreaming</span>
          </div>
        </motion.header>

        {/* WELCOME NOTE */}
        {showWelcome && (
          <motion.div
            className="little-letters-welcome"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, scale: 0.95 }
            }
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="little-letters-welcome-icon">
              🧸
            </span>

            <div>
              <strong>A little note for you...</strong>
              <p>
                Pick a postcard, flip it over, and discover
                something lovely. Save the letters that
                make your heart smile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              aria-label="Dismiss welcome note"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* COLLECTION TOOLBAR */}
        <div className="little-letters-toolbar">
          <div className="little-letters-toolbar-title">
            <Stars size={19} />
            <div>
              <h2>Postcard Garden</h2>
              <span>
                {visibleLetters.length} lovely letters
              </span>
            </div>
          </div>

          <div
            className="little-letters-filters"
            aria-label="Filter postcards"
          >
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
            >
              All Letters
            </button>

            <button
              type="button"
              className={filter === "favorites" ? "active" : ""}
              onClick={() => setFilter("favorites")}
              aria-pressed={filter === "favorites"}
            >
              <Heart size={14} />
              Favorites ({favorites.length})
            </button>
          </div>
        </div>

        {/* FLOATING POSTCARDS */}
        {visibleLetters.length > 0 ? (
          <div className="little-letters-grid">
            {visibleLetters.map((letter, index) => (
              <LittleLetterCard
                key={letter.id}
                letter={letter}
                index={index}
                isFavorite={favorites.includes(letter.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="little-letters-empty">
            <span>💗</span>
            <h3>No favorite letters yet</h3>
            <p>
              Visit the postcard garden and tap the heart
              on a letter you love.
            </p>

            <button
              type="button"
              onClick={() => setFilter("all")}
            >
              Explore Letters
            </button>
          </div>
        )}

<MyLittleNotes />

        {/* BOTTOM NOTE */}
        <footer className="little-letters-footer">
          <span>🌷</span>

          <p>
            Every little step is part of your beautiful story.
          </p>

          <Link to="/study-room">
            Return to your cozy study room
          </Link>

          <small>
            Made with ♡ for your FocusFlow journey
          </small>
        </footer>
      </div>
    </main>
  );
}
