
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CloudRain,
  Headphones,
  Heart,
  Lightbulb,
  Moon,
  Play,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

import "./Home.css";

const features = [
  {
    icon: Timer,
    title: "Smart Focus Timer",
    description:
      "Stay in your flow with customizable Pomodoro sessions and gentle breaks.",
    tone: "gold",
  },
  {
    icon: Headphones,
    title: "Ambient Sound Studio",
    description:
      "Create your perfect atmosphere with rain, café, and fireplace sounds.",
    tone: "blue",
  },
  {
    icon: Heart,
    title: "Meet Mochi",
    description:
      "Your adorable animated cat companion brings joy to every study session.",
    tone: "pink",
  },
  {
    icon: CheckCircle2,
    title: "Daily Task Planner",
    description:
      "Organize your goals, track progress, and celebrate little victories.",
    tone: "green",
  },
  {
    icon: BarChart3,
    title: "Focus Analytics",
    description:
      "Explore animated charts, study streaks, daily goals, and focus history.",
    tone: "purple",
  },
  {
    icon: BookOpen,
    title: "Your Study Sanctuary",
    description:
      "An immersive anime-inspired space designed for peaceful productivity.",
    tone: "gold",
  },
] as const;

export default function Home() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [rainOn, setRainOn] = useState(true);
  const [lampOn, setLampOn] = useState(true);

  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 37.17 + 8) % 100}%`,
        top: `${(i * 23.41 + 6) % 100}%`,
        delay: `${(i * 0.37) % 5}s`,
        size: `${1 + (i % 3)}px`,
      })),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 17.73 + 12) % 100}%`,
        top: `${(i * 31.11 + 10) % 95}%`,
        delay: `${(i * 0.53) % 6}s`,
      })),
    []
  );

  const raindrops = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 29.13) % 100}%`,
        delay: `${(i * 0.17) % 2}s`,
        duration: `${0.8 + (i % 4) * 0.2}s`,
      })),
    []
  );

  const openRoom = () => navigate("/study-room");
  const openDashboard = () => navigate("/dashboard");

  return (
    <div className="premium-home">
      {/* Animated atmosphere */}
      <div className="premium-atmosphere" aria-hidden="true">
        <div className="premium-aurora premium-aurora-one" />
        <div className="premium-aurora premium-aurora-two" />

        {stars.map((star) => (
          <span
            key={star.id}
            className="premium-star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}

        {particles.map((particle) => (
          <span
            key={particle.id}
            className="premium-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <header className="premium-navbar">
        <button
          type="button"
          className="premium-brand"
          onClick={() => navigate("/")}
          aria-label="FocusFlow home"
        >
          <span className="premium-brand-icon">
            <Moon size={23} />
          </span>

          <span>
            Focus<span>Flow</span>
          </span>
        </button>

        <nav
          className="premium-nav-links"
          aria-label="Main navigation"
        >
          <a href="#features">Features</a>
          <a href="#experience">Experience</a>

          <button
            type="button"
            onClick={openDashboard}
          >
            Dashboard
          </button>
        </nav>

        <button
          type="button"
          className="premium-nav-cta"
          onClick={openRoom}
        >
          Launch App
          <ArrowRight size={16} />
        </button>
      </header>

      <main>
        {/* Hero */}
        <section className="premium-hero">
          <motion.div
            className="premium-hero-copy"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, y: 30 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="premium-eyebrow">
              <Sparkles size={15} />
              THE COZIEST WAY TO STAY PRODUCTIVE
              <span>✦</span>
            </div>

            <h1>
              Focus Better.
              <br />
              Dream Bigger.
              <br />
              <span>Study Beautifully.</span>
            </h1>

            <p className="premium-hero-description">
              Step into your own peaceful anime-inspired
              study world. Stay focused with smart tools,
              relaxing sounds, gentle animations, and
              your adorable companion Mochi.
            </p>

            <div className="premium-hero-actions">
              <motion.button
                type="button"
                className="premium-primary-button"
                onClick={openRoom}
                whileHover={
                  reducedMotion
                    ? undefined
                    : { y: -4, scale: 1.03 }
                }
                whileTap={{ scale: 0.97 }}
              >
                <Play size={17} fill="currentColor" />
                Start Focusing
                <ArrowRight size={18} />
              </motion.button>

              <button
                type="button"
                className="premium-outline-button"
                onClick={openDashboard}
              >
                <BarChart3 size={18} />
                View Dashboard
              </button>
            </div>

            <div className="premium-hero-perks">
              <span>
                <CheckCircle2 size={15} />
                Free to use
              </span>

              <span>
                <Sparkles size={15} />
                Immersive animations
              </span>

              <span>
                <Heart size={15} />
                Made for focus
              </span>
            </div>
          </motion.div>

          {/* Hero preview */}
          <motion.div
            className="premium-preview-shell"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, y: 35, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.15,
            }}
          >
            <div className="premium-preview-glow" />

            <div className="premium-preview-card">
              <div className="premium-preview-toolbar">
                <div className="premium-window-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="premium-preview-title">
                  <Moon size={14} />
                  Your Cozy Study Room
                </span>

                <span className="premium-preview-live">
                  <span />
                  LIVE PREVIEW
                </span>
              </div>

              <div className="premium-room-scene">
                <div className="premium-room-glow" />

                <div className="premium-room-window">
                  <div className="premium-room-sky">
                    <div className="premium-room-moon" />

                    <span className="premium-room-star rs1">
                      ✦
                    </span>
                    <span className="premium-room-star rs2">
                      ✧
                    </span>
                    <span className="premium-room-star rs3">
                      ✦
                    </span>

                    {rainOn && (
                      <div className="premium-room-rain">
                        {raindrops.map((drop) => (
                          <span
                            key={drop.id}
                            className="premium-raindrop"
                            style={{
                              left: drop.left,
                              animationDelay: drop.delay,
                              animationDuration: drop.duration,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="premium-window-v" />
                  <div className="premium-window-h" />
                </div>

                <div className="premium-room-shelf">
                  <div className="premium-shelf-items">
                    <span>📚</span>
                    <span>🪴</span>
                    <span>🕯️</span>
                  </div>
                  <div className="premium-shelf-board" />
                </div>

                <div className="premium-room-poster">
                  ✨
                </div>

                <div className="premium-room-desk">
                  <div className="premium-desk-top" />
                  <div className="premium-desk-front" />
                  <div className="premium-desk-leg left" />
                  <div className="premium-desk-leg right" />
                </div>

                <div className="premium-room-laptop">
                  <div className="premium-laptop-screen">
                    <Moon size={25} />
                    <span>Focus Mode</span>
                  </div>
                  <div className="premium-laptop-base" />
                </div>

                <div
                  className={`premium-room-lamp ${
                    lampOn ? "premium-lamp-active" : ""
                  }`}
                >
                  <div className="premium-lamp-glow" />
                  <div className="premium-lamp-shade" />
                  <div className="premium-lamp-stem" />
                  <div className="premium-lamp-base" />
                </div>

                <div className="premium-room-cat">🐈</div>
                <div className="premium-room-mug">☕</div>

                <div className="premium-room-floor" />
              </div>

              <div className="premium-preview-footer">
                <div className="premium-preview-status">
                  <CloudRain size={17} />
                  Cozy Rainy Night
                </div>

                <div className="premium-preview-controls">
                  <button
                    type="button"
                    className={rainOn ? "active" : ""}
                    aria-label={
                      rainOn
                        ? "Turn preview rain off"
                        : "Turn preview rain on"
                    }
                    aria-pressed={rainOn}
                    onClick={() => setRainOn((v) => !v)}
                  >
                    <CloudRain size={17} />
                  </button>

                  <button
                    type="button"
                    className={lampOn ? "active" : ""}
                    aria-label={
                      lampOn
                        ? "Turn preview lamp off"
                        : "Turn preview lamp on"
                    }
                    aria-pressed={lampOn}
                    onClick={() => setLampOn((v) => !v)}
                  >
                    <Lightbulb size={17} />
                  </button>
                </div>
              </div>
            </div>

            <motion.div
              className="premium-floating-card premium-floating-focus"
              animate={
                reducedMotion
                  ? undefined
                  : { y: [0, -9, 0] }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="premium-floating-icon">
                <Timer size={20} />
              </span>

              <div>
                <strong>Focus Mode</strong>
                <small>One session at a time</small>
              </div>
            </motion.div>

            <motion.div
              className="premium-floating-card premium-floating-mochi"
              animate={
                reducedMotion
                  ? undefined
                  : { y: [0, 8, 0] }
              }
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="premium-floating-cat">😺</span>
              <div>
                <strong>Mochi says...</strong>
                <small>You got this! ♡</small>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Product highlights */}
        <section className="premium-highlights">
          <div>
            <span className="premium-highlight-icon">
              <Zap size={19} />
            </span>
            <strong>Stay Focused</strong>
            <small>Pomodoro sessions</small>
          </div>

          <div>
            <span className="premium-highlight-icon">
              <Headphones size={19} />
            </span>
            <strong>Feel Relaxed</strong>
            <small>Ambient soundscapes</small>
          </div>

          <div>
            <span className="premium-highlight-icon">
              <Target size={19} />
            </span>
            <strong>Reach Goals</strong>
            <small>Daily progress tracking</small>
          </div>

          <div>
            <span className="premium-highlight-icon">
              <TrendingUp size={19} />
            </span>
            <strong>Grow Daily</strong>
            <small>Study analytics</small>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="premium-features-section"
        >
          <motion.div
            className="premium-section-heading"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, y: 25 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="premium-section-label">
              <Star size={15} />
              EVERYTHING YOU NEED
            </div>

            <h2>
              Productivity, but make it
              <span> magical.</span>
            </h2>

            <p>
              Powerful study tools wrapped in a calm,
              beautiful, and immersive experience.
            </p>
          </motion.div>

          <div className="premium-feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  className={`premium-feature-card premium-tone-${feature.tone}`}
                  initial={
                    reducedMotion
                      ? false
                      : { opacity: 0, y: 35 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.55,
                    delay: (index % 3) * 0.09,
                  }}
                  whileHover={
                    reducedMotion
                      ? undefined
                      : { y: -7 }
                  }
                >
                  <div className="premium-feature-icon">
                    <Icon size={25} />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>

                  <span className="premium-feature-corner">
                    ✦
                  </span>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Experience */}
        <section
          id="experience"
          className="premium-experience-section"
        >
          <motion.div
            className="premium-experience-card"
            initial={
              reducedMotion
                ? false
                : { opacity: 0, y: 30 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="premium-experience-symbol">
              <Moon size={36} />
            </div>

            <div className="premium-section-label">
              YOUR SPACE. YOUR PACE.
            </div>

            <h2>
              A calmer way to
              <br />
              <span>get things done.</span>
            </h2>

            <p>
              Let the rain fall, turn on your favorite
              sounds, and enjoy a peaceful study session
              in your own little world.
            </p>

            <motion.button
              type="button"
              className="premium-primary-button"
              onClick={openRoom}
              whileHover={
                reducedMotion
                  ? undefined
                  : { scale: 1.04 }
              }
              whileTap={{ scale: 0.97 }}
            >
              Enter Your Study Room
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </section>
      </main>

      <footer className="premium-footer">
        <div className="premium-footer-brand">
          <Moon size={18} />
          FocusFlow
        </div>

        <p>
          A little focus. A little magic. A better day. ♡
        </p>
      </footer>
    </div>
  );
}
