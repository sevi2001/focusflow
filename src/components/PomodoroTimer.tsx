
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

type Mode = "focus" | "short" | "long";

const durations: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(durations.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    deadlineRef.current = Date.now() + timeLeft * 1000;

    const interval = window.setInterval(() => {
      if (deadlineRef.current === null) return;

      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        deadlineRef.current = null;

        if (mode === "focus") {
          setCompletedSessions((previous) => previous + 1);
        }
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
      deadlineRef.current = null;
    };
  }, [isRunning, mode]);

  const changeMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(durations[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;

  const progress =
    ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-[#151a30]/85 p-6 text-center shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-center gap-2 text-amber-200">
        <Timer size={20} />
        <h2 className="text-lg font-semibold">
          Focus Timer
        </h2>
      </div>

      <div className="mb-7 flex flex-wrap justify-center gap-2">
        {(
          [
            ["focus", "Focus"],
            ["short", "Short Break"],
            ["long", "Long Break"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => changeMode(value)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              mode === value
                ? "bg-amber-300 text-slate-900"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mb-7 flex h-56 w-56 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 224 224"
        >
          <circle
            cx="112"
            cy="112"
            r="98"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="9"
          />
          <circle
            cx="112"
            cy="112"
            r="98"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 98}
            strokeDashoffset={
              2 * Math.PI * 98 * (1 - progress / 100)
            }
            className="transition-all duration-300"
          />
        </svg>

        <div>
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold tracking-wider text-white"
          >
            {formattedTime}
          </motion.div>

          <p className="mt-3 text-sm text-slate-400">
            {mode === "focus"
              ? "Time to concentrate"
              : "Take a little rest"}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-2 rounded-full bg-amber-300 px-7 py-3 font-semibold text-slate-900 transition hover:bg-amber-200"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          onClick={resetTimer}
          aria-label="Reset timer"
          className="rounded-full border border-white/20 p-3 text-white transition hover:bg-white/10"
        >
          <RotateCcw size={19} />
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        ✨ Completed focus sessions:{" "}
        <span className="font-semibold text-amber-200">
          {completedSessions}
        </span>
      </p>
    </div>
  );
}
