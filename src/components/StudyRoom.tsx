
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import DreamRoomDecorations from "./DreamRoomDecorations";

import {
  ArrowLeft,
  BarChart3,
  CloudRain,
  CloudSun,
  Heart,
  Lightbulb,
  Moon,
  Sparkles,
  Star,
  Sun,
  WandSparkles,
} from "lucide-react";

import PomodoroTimer from "./PomodoroTimer";
import DailyTaskPlanner from "./DailyTaskPlanner";
import CatCompanion from "./CatCompanion";
import AmbientSounds from "./AmbientSounds";

import "./StudyRoom.css";

type SceneTheme = "rainy" | "starry" | "sunset";

const sceneOptions: {
  id: SceneTheme;
  label: string;
  icon: typeof Moon;
}[] = [
  { id: "rainy", label: "Rainy Night", icon: CloudRain },
  { id: "starry", label: "Starry Night", icon: Moon },
  { id: "sunset", label: "Golden Sunset", icon: CloudSun },
];

export default function StudyRoom() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [theme, setTheme] = useState<SceneTheme>("rainy");
  const [rainOn, setRainOn] = useState(true);
  const [lampOn, setLampOn] = useState(true);
  const [fairyLightsOn, setFairyLightsOn] = useState(true);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  const stars = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        id: i,
        left: `${(i * 31.47 + 8) % 100}%`,
        top: `${(i * 19.83 + 5) % 100}%`,
        delay: `${(i * 0.37) % 5}s`,
      })),
    []
  );

  <DreamRoomDecorations />
  
  const raindrops = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${(i * 23.71) % 100}%`,
        delay: `${(i * 0.19) % 2}s`,
        duration: `${0.8 + (i % 4) * 0.18}s`,
      })),
    []
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 17.37 + 12) % 100}%`,
        top: `${(i * 29.19 + 7) % 90}%`,
        delay: `${(i * 0.57) % 6}s`,
      })),
    []
  );

  const sceneTitle =
    theme === "rainy"
      ? "Cozy Rainy Night"
      : theme === "starry"
      ? "Dreamy Starry Night"
      : "Golden Sunset";

  return (
    <div className={`premium-study-page scene-${theme}`}>
      {/* Ambient background */}
      <div
        className="premium-study-atmosphere"
        aria-hidden="true"
      >
        <div className="study-ambient-orb orb-one" />
        <div className="study-ambient-orb orb-two" />

        {stars.map((star) => (
          <span
            key={star.id}
            className="study-background-star"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
            }}
          />
        ))}

        {fireflies.map((fly) => (
          <span
            key={fly.id}
            className="study-background-firefly"
            style={{
              left: fly.left,
              top: fly.top,
              animationDelay: fly.delay,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="premium-study-header">
        <div className="study-header-left">
          <button
            type="button"
            className="study-back-button"
            onClick={() => navigate("/")}
            aria-label="Back to home"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="study-brand">
            <div className="study-brand-icon">
              <Moon size={23} />
            </div>

            <div>
              <strong>
                Focus<span>Flow</span>
              </strong>
              <small>Your cozy little sanctuary</small>
            </div>
          </div>
        </div>

        <div className="study-header-right">
          <div className="study-header-status">
            <span className="study-status-dot" />
            YOUR PEACEFUL SPACE
          </div>

          <button
            type="button"
            className="study-dashboard-link"
            onClick={() => navigate("/dashboard")}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
        </div>
      </header>

      <main className="premium-study-container">
        {/* Intro */}
        <motion.section
          className="study-welcome"
          initial={
            reducedMotion ? false : { opacity: 0, y: 20 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div>
            <div className="study-eyebrow">
              <Sparkles size={15} />
              YOUR LITTLE WORLD OF FOCUS
            </div>

            <h1>
              Welcome to your <span>happy place.</span>
            </h1>

            <p>
              Make yourself comfortable, find your rhythm,
              and let the little moments of progress add up.
            </p>
          </div>

          <div className="study-welcome-badge">
            <Heart size={19} />
            One step at a time ♡
          </div>
        </motion.section>

        {/* Main layout */}
        <div className="premium-study-layout">
          {/* Left column */}
          <div className="premium-study-main">
            <motion.section
              className="premium-scene-card"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 28 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.12,
              }}
            >
              {/* Scene toolbar */}
              <div className="premium-scene-toolbar">
                <div className="scene-toolbar-title">
                  <div className="scene-title-icon">
                    <WandSparkles size={19} />
                  </div>

                  <div>
                    <h2>Your Cozy Study World</h2>
                    <p>Make this little space your own</p>
                  </div>
                </div>

                <div className="scene-live-label">
                  <span />
                  LIVE SCENE
                </div>
              </div>

              {/* Scene themes */}
              <div
                className="premium-scene-themes"
                role="group"
                aria-label="Choose study room atmosphere"
              >
                {sceneOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      type="button"
                      key={option.id}
                      className={
                        theme === option.id ? "selected" : ""
                      }
                      onClick={() => setTheme(option.id)}
                      aria-pressed={theme === option.id}
                    >
                      <Icon size={16} />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Animated illustrated room */}
              <div className="premium-study-scene">
                <div className="scene-wall-glow" />

                {/* Window */}
                <div className="scene-window">
                  <div className="scene-window-sky">
                    <div className="scene-celestial-body" />

                    {theme !== "sunset" && (
                      <>
                        <span className="scene-window-star s1">
                          ✦
                        </span>
                        <span className="scene-window-star s2">
                          ✧
                        </span>
                        <span className="scene-window-star s3">
                          ✦
                        </span>
                        <span className="scene-window-star s4">
                          ✧
                        </span>
                      </>
                    )}

                    {theme === "rainy" && rainOn && (
                      <div className="scene-rain">
                        {raindrops.map((drop) => (
                          <span
                            key={drop.id}
                            className="scene-rain-drop"
                            style={{
                              left: drop.left,
                              animationDelay: drop.delay,
                              animationDuration: drop.duration,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="scene-mountain mountain-back" />
                    <div className="scene-mountain mountain-front" />
                  </div>

                  <div className="scene-window-frame-v" />
                  <div className="scene-window-frame-h" />
                  <div className="scene-window-sill" />
                </div>

                {/* Fairy lights */}
                <div
                  className={`scene-fairy-lights ${
                    fairyLightsOn ? "lights-on" : ""
                  }`}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} />
                  ))}
                </div>

                {/* Shelf */}
                <div className="scene-shelf">
                  <div className="scene-shelf-items">
                    <span>📚</span>
                    <span>🪴</span>
                    <span>🕯️</span>
                  </div>
                  <div className="scene-shelf-board" />
                </div>

                {/* Wall decorations */}
                <div className="scene-wall-poster">☁️</div>
                <div className="scene-hanging-star">✦</div>

                {/* Desk */}
                <div className="scene-desk">
                  <div className="scene-desk-top" />
                  <div className="scene-desk-front" />
                  <div className="scene-desk-leg left" />
                  <div className="scene-desk-leg right" />
                </div>

                {/* Laptop */}
                <div className="scene-laptop">
                  <div className="scene-laptop-screen">
                    <Moon size={28} />
                    <span>Focus Mode</span>
                  </div>
                  <div className="scene-laptop-base" />
                </div>

                {/* Lamp */}
                <div
                  className={`scene-lamp ${
                    lampOn ? "lamp-active" : ""
                  }`}
                >
                  <div className="scene-lamp-glow" />
                  <div className="scene-lamp-shade" />
                  <div className="scene-lamp-neck" />
                  <div className="scene-lamp-base" />
                </div>

                {/* Cat and decorations */}
                <div className="scene-cat" aria-hidden="true">
                  🐈
                </div>

                <div className="scene-mug" aria-hidden="true">
                  ☕
                </div>

                <div className="scene-books" aria-hidden="true">
                  📖
                </div>

                <div className="scene-floor" />
              </div>

              {/* Scene footer */}
              <div className="premium-scene-footer">
                <div className="scene-current-label">
                  {theme === "sunset" ? (
                    <Sun size={18} />
                  ) : theme === "rainy" ? (
                    <CloudRain size={18} />
                  ) : (
                    <Moon size={18} />
                  )}

                  <div>
                    <strong>{sceneTitle}</strong>
                    <small>
                      A peaceful moment, just for you
                    </small>
                  </div>
                </div>

                <div className="scene-control-buttons">
                  <button
                    type="button"
                    onClick={() => setRainOn((v) => !v)}
                    disabled={theme !== "rainy"}
                    aria-label={
                      rainOn ? "Turn rain off" : "Turn rain on"
                    }
                    aria-pressed={theme === "rainy" && rainOn}
                    className={
                      theme === "rainy" && rainOn
                        ? "active"
                        : ""
                    }
                  >
                    <CloudRain size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLampOn((v) => !v)}
                    aria-label={
                      lampOn ? "Turn lamp off" : "Turn lamp on"
                    }
                    aria-pressed={lampOn}
                    className={lampOn ? "active" : ""}
                  >
                    <Lightbulb size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFairyLightsOn((v) => !v)
                    }
                    aria-label={
                      fairyLightsOn
                        ? "Turn fairy lights off"
                        : "Turn fairy lights on"
                    }
                    aria-pressed={fairyLightsOn}
                    className={
                      fairyLightsOn ? "active" : ""
                    }
                  >
                    <Star size={18} />
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Existing Daily Task Planner */}
            <motion.div
              className="premium-tool-wrapper"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 25 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.55 }}
            >
              <DailyTaskPlanner />
            </motion.div>
          </div>

          {/* Right sidebar */}
          <aside className="premium-study-sidebar">
            <motion.div
              className="premium-tool-wrapper"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, x: 20 }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
            >
              <PomodoroTimer />
            </motion.div>

            <motion.div
              className="premium-tool-wrapper"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, x: 20 }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
              }}
            >
              <CatCompanion />
            </motion.div>

            <motion.div
              className="premium-tool-wrapper"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, x: 20 }
              }
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6 }}
            >
              <AmbientSounds
                isPlaying={isAmbientPlaying}
                onPlayingChange={setIsAmbientPlaying}
              />
            </motion.div>

            {/* Motivation card */}
            <motion.div
              className="premium-motivation-card"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 20 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="motivation-card-icon">
                <Sparkles size={23} />
              </div>

              <h3>A little reminder ♡</h3>

              <p>
                You don't have to do everything today.
                Just take one little step, and let
                yourself be proud of it.
              </p>

              <span>Keep glowing, little star ✨</span>
            </motion.div>
          </aside>
        </div>

        {/* Bottom message */}
        <footer className="premium-study-footer">
          <div>
            <Moon size={17} />
            FocusFlow
          </div>

          <span>
            A little focus. A little magic. A better day.
          </span>
        </footer>
      </main>
    </div>
  );
}
