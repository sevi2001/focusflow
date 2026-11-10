
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CloudRain,
  Coffee,
  Moon,
  Sparkles,
  Timer,
  CheckCircle2,
  Headphones,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Timer,
    title: "Focus Timer",
    description:
      "Stay productive with relaxing Pomodoro sessions and mindful breaks.",
    color: "text-amber-300",
    bg: "bg-amber-300/10",
  },
  {
    icon: CloudRain,
    title: "Cozy Study Rooms",
    description:
      "Escape into peaceful rainy nights, warm cafés, and dreamy study spaces.",
    color: "text-sky-300",
    bg: "bg-sky-300/10",
  },
  {
    icon: BookOpen,
    title: "Daily Planner",
    description:
      "Organize your tasks, set goals, and celebrate every little achievement.",
    color: "text-purple-300",
    bg: "bg-purple-300/10",
  },
  {
    icon: Headphones,
    title: "Ambient Sounds",
    description:
      "Relax with gentle rain, soft café sounds, and calming background audio.",
    color: "text-pink-300",
    bg: "bg-pink-300/10",
  },
  {
    icon: CheckCircle2,
    title: "Progress Tracking",
    description:
      "Track your study hours, daily streaks, and completed focus sessions.",
    color: "text-emerald-300",
    bg: "bg-emerald-300/10",
  },
  {
    icon: Heart,
    title: "Study Companion",
    description:
      "Meet your adorable virtual companion who keeps you company while studying.",
    color: "text-rose-300",
    bg: "bg-rose-300/10",
  },
];

export default function Home() {
    const navigate = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c1020] text-white">

      {/* Background glowing effects */}
      <div className="pointer-events-none absolute left-[-150px] top-20 h-[450px] w-[450px] rounded-full bg-purple-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute right-[-100px] top-[350px] h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[130px]" />

      {/* Animated Stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 19) % 80}%`,
            }}
            animate={{
              opacity: [0.15, 0.9, 0.15],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 2 + (i % 4),
              repeat: Infinity,
              delay: (i % 5) * 0.5,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-900">
            <Coffee size={23} />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Focus<span className="text-amber-300">Flow</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-amber-300">
            Features
          </a>
          <a href="#about" className="transition hover:text-amber-300">
            About
          </a>
        </div>

        <button
  onClick={() => navigate("/study-room")}
  className="rounded-full border border-amber-300/40 px-5 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-300/10"
>
  Get Started
</button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-14 px-6 pb-24 pt-20 lg:flex-row lg:pt-28">

        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-200"
          >
            <Sparkles size={16} />
            Your little corner of calm
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl font-bold leading-[1.15] tracking-tight md:text-7xl"
          >
            Study better.
            <br />
            <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-pink-300 bg-clip-text text-transparent">
              Feel calmer.
            </span>
            <br />
            Dream bigger.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-7 max-w-xl text-lg leading-8 text-slate-300 lg:mx-0"
          >
            Welcome to your cozy virtual study space.
            Focus with peaceful timers, relaxing sounds,
            beautiful study rooms, and a little companion
            cheering you on.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start"
          >
            <motion.button
  onClick={() => navigate("/study-room")}
  whileHover={{ scale: 1.06 }}
  whileTap={{ scale: 0.95 }}
  className="flex items-center gap-3 rounded-full bg-amber-300 px-8 py-4 font-semibold text-slate-900 shadow-lg shadow-amber-300/20"
>
  Enter Study Room
  <ArrowRight size={20} />
</motion.button>
            <a
              href="#features"
              className="rounded-full border border-white/20 px-8 py-4 font-medium text-white transition hover:bg-white/10"
            >
              Explore Features
            </a>
          </motion.div>

          <div className="mt-10 flex items-center justify-center gap-3 text-sm text-slate-400 lg:justify-start">
            <Moon size={17} className="text-amber-200" />
            Make every study moment peaceful.
          </div>
        </div>

        {/* Right Visual */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative flex-1"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto max-w-xl"
          >
            <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-r from-purple-500/20 to-amber-300/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[#1d2138] p-4 shadow-2xl">
              <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-b from-[#283456] via-[#4c3e65] to-[#9c6671]">

                {/* Moon */}
                <div className="absolute right-12 top-10 h-20 w-20 rounded-full bg-amber-100 shadow-[0_0_70px_25px_rgba(255,222,160,0.3)]" />

                {/* Window */}
                <div className="absolute left-[12%] top-[10%] h-[60%] w-[48%] rounded-t-[70px] border-[10px] border-[#493448] bg-gradient-to-b from-[#172342] to-[#69577c] shadow-xl">
                  <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-[#493448]" />
                  <div className="absolute left-0 top-1/2 h-2 w-full bg-[#493448]" />

                  {Array.from({ length: 16 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-6 w-[2px] rounded-full bg-blue-200/40"
                      style={{
                        left: `${(i * 29) % 95}%`,
                        top: `${(i * 17) % 85}%`,
                      }}
                      animate={{ y: [0, 40], opacity: [0, 0.8, 0] }}
                      transition={{
                        duration: 1.5 + (i % 3) * 0.4,
                        repeat: Infinity,
                        delay: (i % 5) * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Desk */}
                <div className="absolute bottom-0 h-[28%] w-full bg-gradient-to-b from-[#754c43] to-[#3b2732]" />

                {/* Laptop */}
                <div className="absolute bottom-[18%] left-[32%] h-[24%] w-[37%] rounded-lg border-[7px] border-[#28283e] bg-gradient-to-br from-[#7187b4] to-[#2b365b] shadow-xl">
                  <div className="flex h-full items-center justify-center">
                    <Coffee className="text-amber-200/70" size={32} />
                  </div>
                </div>

                {/* Desk Lamp */}
                <div className="absolute bottom-[25%] right-[12%] h-20 w-20 rounded-full bg-amber-200/30 blur-2xl" />
                <div className="absolute bottom-[18%] right-[17%] h-[30%] w-2 rotate-[-15deg] rounded-full bg-[#d7b2a0]" />
                <div className="absolute bottom-[43%] right-[13%] h-12 w-20 rounded-t-full rounded-b-lg bg-amber-200 shadow-[0_12px_45px_rgba(255,210,120,0.55)]" />

                {/* Decorative Cat */}
                <div className="absolute bottom-[17%] left-[12%] text-6xl">
                  🐈
                </div>

                <div className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs text-white backdrop-blur-md">
                  🌧️ Rainy Night Room
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-24"
      >
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Everything you need
          </p>
          <h2 className="text-4xl font-bold md:text-5xl">
            Your perfect study companion
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            A peaceful space designed to help you stay focused,
            motivated, and inspired every day.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-lg transition-colors hover:border-amber-300/20 hover:bg-white/[0.07]"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} ${feature.color}`}
                >
                  <Icon size={26} />
                </div>

                <h3 className="mb-3 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="leading-7 text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[40px] border border-amber-300/15 bg-gradient-to-br from-purple-500/10 to-amber-300/10 px-8 py-16"
        >
          <Sparkles
            size={35}
            className="mx-auto mb-6 text-amber-300"
          />

          <h2 className="text-4xl font-bold">
            Small steps. Big dreams.
          </h2>

          <p className="mx-auto mt-6 max-w-xl leading-8 text-slate-300">
            FocusFlow is your personal peaceful corner.
            Whether you're studying for exams, working on
            projects, or learning something new, we're here
            to make the journey a little more magical.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FocusFlow.
        Made with ☕ and a little magic.
      </footer>
    </div>
  );
}
