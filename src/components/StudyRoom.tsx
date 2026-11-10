
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CloudRain,
  Lightbulb,
  Moon,
  Sparkles,
  Volume2,
} from "lucide-react";

import PomodoroTimer from "./PomodoroTimer";
import "./StudyRoom.css";

export default function StudyRoom() {
  const navigate = useNavigate();

  const [rainEnabled, setRainEnabled] = useState(true);
  const [lampEnabled, setLampEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const raindrops = useMemo(
    () =>
      Array.from({ length: 45 }, (_, index) => ({
        id: index,
        left: `${(index * 37.7) % 100}%`,
        delay: `${(index * 0.31) % 3}s`,
        duration: `${1 + (index % 5) * 0.22}s`,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      {/* Header */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#10162a] px-6 py-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-amber-200"
        >
          <ArrowLeft size={18} />
          Back Home
        </button>

        <div className="flex items-center gap-2 text-xl font-bold">
          <Moon className="text-amber-300" />
          Focus<span className="text-amber-300">Flow</span>
        </div>

        <span className="flex items-center gap-2 text-sm text-amber-200">
          <Sparkles size={16} />
          Your peaceful corner
        </span>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-8 px-5 py-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Room */}
        <section className="min-w-0">
          <div className="mb-5">
            <h1 className="text-3xl font-bold">
              Rainy Night Study Room 🌙
            </h1>
            <p className="mt-2 text-slate-400">
              Get comfortable, take a deep breath, and enjoy your focus time.
            </p>
          </div>

          <div className="study-scene">
            {/* Wall decorations */}
            <div className="scene-stars">✦ ✧ ✦</div>

            {/* Window */}
            <div className="study-window">
              <div className="window-moon" />

              <div className="window-stars">
                ✦ &nbsp; ✧ &nbsp; ✦ &nbsp; ✧
              </div>

              {rainEnabled && (
                <div className="rain-container">
                  {raindrops.map((drop) => (
                    <span
                      key={drop.id}
                      className="raindrop"
                      style={{
                        left: drop.left,
                        animationDelay: drop.delay,
                        animationDuration: drop.duration,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="window-cross-horizontal" />
              <div className="window-cross-vertical" />
            </div>

            {/* Shelves */}
            <div className="room-shelf">
              <span>📚</span>
              <span>🪴</span>
              <span>🕯️</span>
            </div>

            {/* Desk */}
            <div className="study-desk">
              <div className="desk-top" />
              <div className="desk-front" />
            </div>

            {/* Laptop */}
            <motion.div
              className="study-laptop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="laptop-screen">
                <Moon size={35} />
                <span>Focus Mode</span>
              </div>
              <div className="laptop-base" />
            </motion.div>

            {/* Lamp */}
            <div
              className={`desk-lamp ${
                lampEnabled ? "lamp-on" : "lamp-off"
              }`}
            >
              <div className="lamp-glow" />
              <div className="lamp-shade" />
              <div className="lamp-stand" />
              <div className="lamp-base" />
            </div>

            {/* Animated cat */}
            <motion.div
              className="study-cat"
              animate={{
                y: [0, -5, 0],
                rotate: [0, 2, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-label="A cozy cat companion"
              role="img"
            >
              🐈
            </motion.div>

            <div className="scene-label">
              🌧️ Cozy Rainy Night
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setRainEnabled(!rainEnabled)}
              aria-pressed={rainEnabled}
              className={`room-control ${
                rainEnabled ? "room-control-active" : ""
              }`}
            >
              <CloudRain size={19} />
              Rain {rainEnabled ? "On" : "Off"}
            </button>

            <button
              onClick={() => setLampEnabled(!lampEnabled)}
              aria-pressed={lampEnabled}
              className={`room-control ${
                lampEnabled ? "room-control-active" : ""
              }`}
            >
              <Lightbulb size={19} />
              Lamp {lampEnabled ? "On" : "Off"}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-pressed={soundEnabled}
              className={`room-control ${
                soundEnabled ? "room-control-active" : ""
              }`}
            >
              <Volume2 size={19} />
              Sound {soundEnabled ? "On" : "Off"}
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Ambient audio playback will be connected in Step 5.
            The sound control currently saves its on/off state
            within this page.
          </p>
        </section>

        {/* Timer Panel */}
        <aside className="flex flex-col gap-5">
          <PomodoroTimer />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-lg font-semibold text-amber-200">
              ☕ A little reminder
            </h3>

            <p className="leading-7 text-slate-300">
              Progress doesn't have to be perfect.
              One focused session at a time is enough.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
