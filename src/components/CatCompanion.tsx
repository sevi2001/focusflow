import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./CatCompanion.css";
import {
  Heart, Moon, Play, Sparkles, Sun, Pencil, Check, X,
  BookOpen, Utensils, PawPrint, Star, ChevronLeft, ChevronRight,
} from "lucide-react";
import "./CatCompanion.css";

type Mood = "idle" | "happy" | "sleeping" | "playing" | "focused" | "eating";
type PetId = "mochi" | "boba" | "kiko" | "panda" | "yuki" | "pip";
type Pet = { id: PetId; name: string; species: string; emoji: string; asleep: string; color: string; treat: string };
type PetState = { name: string; happiness: number; energy: number };
type PetStateMap = Record<PetId, PetState>;

const NAME_KEY = "focusflow_cat_name";
const SELECTED_KEY = "focusflow_selected_pet";
const PETS_KEY = "focusflow_pet_sanctuary_v1";

const pets: Pet[] = [
  { id: "mochi", name: "Mochi", species: "Cozy Cat", emoji: "🐱", asleep: "😽", color: "#f8d99c", treat: "fish treat" },
  { id: "boba", name: "Boba", species: "Fluffy Bunny", emoji: "🐰", asleep: "🐰", color: "#f9b8dc", treat: "carrot" },
  { id: "kiko", name: "Kiko", species: "Playful Puppy", emoji: "🐶", asleep: "🐶", color: "#eec18c", treat: "dog biscuit" },
  { id: "panda", name: "Panda", species: "Sleepy Panda", emoji: "🐼", asleep: "🐼", color: "#c3e5d0", treat: "bamboo snack" },
  { id: "yuki", name: "Yuki", species: "Magic Fox", emoji: "🦊", asleep: "🦊", color: "#f6b48f", treat: "berry" },
  { id: "pip", name: "Pip", species: "Tiny Penguin", emoji: "🐧", asleep: "🐧", color: "#a9d7f7", treat: "fish snack" },
];

const isPetId = (value: unknown): value is PetId =>
  typeof value === "string" && pets.some((pet) => pet.id === value);

function loadSelected(): PetId {
  try {
    const value = localStorage.getItem(SELECTED_KEY);
    return isPetId(value) ? value : "mochi";
  } catch {
    return "mochi";
  }
}

function loadPets(): PetStateMap {
  const defaults = Object.fromEntries(
    pets.map((pet) => [pet.id, { name: pet.name, happiness: 80, energy: 80 }])
  ) as PetStateMap;
  try {
    const oldName = localStorage.getItem(NAME_KEY)?.trim().slice(0, 24);
    if (oldName) defaults.mochi.name = oldName;
    const raw = localStorage.getItem(PETS_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    const data = parsed as Record<string, unknown>;
    for (const pet of pets) {
      const value = data[pet.id];
      if (!value || typeof value !== "object") continue;
      const item = value as Partial<PetState>;
      defaults[pet.id] = {
        name: typeof item.name === "string" && item.name.trim()
          ? item.name.trim().slice(0, 24) : defaults[pet.id].name,
        happiness: typeof item.happiness === "number" && Number.isFinite(item.happiness)
          ? Math.max(0, Math.min(100, item.happiness)) : 80,
        energy: typeof item.energy === "number" && Number.isFinite(item.energy)
          ? Math.max(0, Math.min(100, item.energy)) : 80,
      };
    }
    // The original Mochi key remains the source of truth for its name.
    if (oldName) defaults.mochi.name = oldName;
    return defaults;
  } catch {
    return defaults;
  }
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export default function CatCompanion() {
  const [selected, setSelected] = useState<PetId>(loadSelected);
  const [petStates, setPetStates] = useState<PetStateMap>(loadPets);
  const [mood, setMood] = useState<Mood>("idle");
  const [message, setMessage] = useState("Your little friend is ready to study with you! ✨");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [reaction, setReaction] = useState(0);
  const [page, setPage] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  const pet = pets.find((item) => item.id === selected)!;
  const state = petStates[selected];
  const name = state.name;
  const moodLabel: Record<Mood, string> = {
    idle: "Relaxed", happy: "Happy", sleeping: "Dreaming", playing: "Playful",
    focused: "Study Buddy", eating: "Snack Time",
  };

  useEffect(() => {
    try {
      localStorage.setItem(PETS_KEY, JSON.stringify(petStates));
      localStorage.setItem(NAME_KEY, petStates.mochi.name);
    } catch { /* Storage may be blocked. */ }
  }, [petStates]);

  useEffect(() => {
    try { localStorage.setItem(SELECTED_KEY, selected); } catch { /* Ignore */ }
  }, [selected]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (mood !== "focused") return;
    const notes = [
      `You've got this! ${name} believes in you. 📚`,
      "One small step at a time. You're doing great! ✨",
      "Remember to drink water and rest your eyes. 💜",
      "Your progress matters more than perfection! 🌟",
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % notes.length;
      setMessage(notes[index]);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [mood, name]);

  const clearAction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const setAction = (nextMood: Mood, text: string, duration?: number) => {
    clearAction();
    setMood(nextMood);
    setMessage(text);
    setReaction((count) => count + 1);
    if (duration) {
      timeoutRef.current = setTimeout(() => {
        setMood("idle");
        setMessage("I'm right here whenever you need a little cheer! 🐾");
      }, duration);
    }
  };

  const updateStats = (happinessDelta: number, energyDelta: number) => {
    setPetStates((previous) => ({
      ...previous,
      [selected]: {
        ...previous[selected],
        happiness: clamp(previous[selected].happiness + happinessDelta),
        energy: clamp(previous[selected].energy + energyDelta),
      },
    }));
  };

  const petCompanion = () => {
    updateStats(8, 0);
    setAction("happy", mood === "sleeping"
      ? `Oh! You woke ${name} up. So many cuddles! 💕`
      : `${name} loves your head pats! Purrs and happy wiggles! 💗`, 3500);
  };

  const play = () => {
    if (state.energy < 10) {
      setMessage(`${name} is a little tired. How about a nap first? 🌙`);
      return;
    }
    updateStats(12, -10);
    setAction("playing", `${name} is having the best playtime ever! ✨`, 5000);
  };

  const feed = () => {
    updateStats(7, 8);
    setAction("eating", `Yum! ${name} loved that ${pet.treat}! 🍓`, 3500);
  };

  const toggleSleep = () => {
    if (mood === "sleeping") {
      updateStats(0, 15);
      setAction("idle", `Good morning, ${name}! Ready for another cozy day? ☀️`);
    } else {
      setAction("sleeping", `Shhh... ${name} is having sweet dreams. Zzz... 🌙`);
    }
  };

  const encourage = () => {
    setAction("focused", `${name} says: You can do this! One task at a time. 📚`);
  };

  const choosePet = (id: PetId) => {
    clearAction();
    setSelected(id);
    setMood("idle");
    setEditing(false);
    setMessage(`Hello! I'm ${petStates[id].name}. Let's have a lovely study day! 🌸`);
  };

  const saveName = () => {
    const clean = draftName.trim().slice(0, 24);
    if (!clean) return;
    setPetStates((previous) => ({
      ...previous,
      [selected]: { ...previous[selected], name: clean },
    }));
    setEditing(false);
    setMessage(`Yay! You can call me ${clean} now! 💕`);
  };

  const movement = reducedMotion ? {} : mood === "sleeping"
    ? { y: [0, 3, 0], rotate: [0, 1, 0] }
    : mood === "playing"
      ? { y: [0, -25, 0, -12, 0], rotate: [0, -12, 12, -5, 0] }
      : mood === "happy"
        ? { y: [0, -12, 0], rotate: [-5, 5, -5] }
        : { y: [0, -5, 0], rotate: [0, 2, 0] };

  const shownPets = pets.slice(page * 3, page * 3 + 3);

  return (
    <section className="sanctuary" style={{ "--pet-accent": pet.color } as React.CSSProperties}>
      <div className="sanctuary-header">
        <div className="sanctuary-heading">
          <span className="sanctuary-header-icon"><PawPrint size={22} /></span>
          <div>
            <span className="sanctuary-eyebrow">YOUR COZY STUDY FRIENDS</span>
            <h2>Magical Pet Sanctuary <Sparkles size={16} /></h2>
          </div>
        </div>
        <span className="sanctuary-mood"><span />{moodLabel[mood]}</span>
      </div>

      <div className="sanctuary-pet-heading">
        {editing ? (
          <div className="sanctuary-name-edit">
            <input autoFocus aria-label="Pet name" maxLength={24} value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") setEditing(false);
              }} />
            <button type="button" aria-label="Save pet name" onClick={saveName}><Check size={17} /></button>
            <button type="button" aria-label="Cancel rename" onClick={() => setEditing(false)}><X size={17} /></button>
          </div>
        ) : (
          <div className="sanctuary-name-line">
            <div><h3>{name}</h3><p>{pet.species} · Your study buddy</p></div>
            <button type="button" aria-label={`Rename ${name}`} onClick={() => {
              setDraftName(name); setEditing(true);
            }}><Pencil size={15} /></button>
          </div>
        )}
        <span className="sanctuary-sparkle"><Star size={15} /> Best friends</span>
      </div>

      <div className={`sanctuary-stage sanctuary-stage--${mood}`}>
        <div className="sanctuary-moon" />
        <div className="sanctuary-stars" aria-hidden="true">✦ <span>✧</span> ✦ <span>✧</span></div>
        <div className="sanctuary-window" aria-hidden="true"><span>☾</span></div>
        <div className="sanctuary-lamp" aria-hidden="true">✧</div>
        <AnimatePresence mode="wait">
          <motion.div key={`${selected}-${message}`} className="sanctuary-bubble" role="status"
            initial={{ opacity: 0, y: 9, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {message}
          </motion.div>
        </AnimatePresence>
        <div className="sanctuary-character-zone">
          <AnimatePresence>
            {(mood === "happy" || mood === "playing" || mood === "eating") && (
              <motion.span key={reaction} className="sanctuary-reaction" aria-hidden="true"
                initial={{ opacity: 0, y: 10, scale: 0.6 }}
                animate={{ opacity: 1, y: -44, scale: 1.2 }}
                exit={{ opacity: 0, y: -65 }} transition={{ duration: 1.2 }}>
                {mood === "happy" ? "💕 ✨ 💗" : mood === "eating" ? "🍓 💕" : "⭐ ✨"}
              </motion.span>
            )}
          </AnimatePresence>
          {mood === "sleeping" && (
            <motion.span className="sanctuary-zzz" aria-hidden="true"
              animate={reducedMotion ? {} : { y: [0, -30, -55], opacity: [0, 1, 0] }}
              transition={{ duration: 2.6, repeat: Infinity }}>Zzz</motion.span>
          )}
          <motion.button type="button" className="sanctuary-character" onClick={petCompanion}
            aria-label={`Pet ${name}`} animate={movement}
            transition={{ duration: mood === "playing" ? 1.2 : mood === "happy" ? 0.75 : 3,
              repeat: reducedMotion ? 0 : Infinity, ease: "easeInOut" }}
            whileTap={{ scale: 0.9 }}>
            <span role="img" aria-label={pet.species}>{mood === "sleeping" ? pet.asleep : pet.emoji}</span>
          </motion.button>
          <div className="sanctuary-character-shadow" />
        </div>
        <span className="sanctuary-stage-hint">Tap your pet to give it a cuddle ♡</span>
      </div>

      <div className="sanctuary-meters">
        <div className="sanctuary-meter">
          <div className="sanctuary-meter-title"><span><Heart size={14} /> Happiness</span><strong>{state.happiness}%</strong></div>
          <div className="sanctuary-meter-track"><motion.div className="sanctuary-meter-fill sanctuary-meter-fill--heart"
            initial={false} animate={{ width: `${state.happiness}%` }} transition={{ duration: 0.4 }} /></div>
        </div>
        <div className="sanctuary-meter">
          <div className="sanctuary-meter-title"><span><Sun size={14} /> Energy</span><strong>{state.energy}%</strong></div>
          <div className="sanctuary-meter-track"><motion.div className="sanctuary-meter-fill sanctuary-meter-fill--energy"
            initial={false} animate={{ width: `${state.energy}%` }} transition={{ duration: 0.4 }} /></div>
        </div>
      </div>

      <div className="sanctuary-actions">
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={petCompanion}><Heart size={17} /> Pet</motion.button>
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={feed}><Utensils size={17} /> Feed</motion.button>
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={play}><Play size={17} /> Play</motion.button>
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={toggleSleep}>
          {mood === "sleeping" ? <Sun size={17} /> : <Moon size={17} />}
          {mood === "sleeping" ? "Wake" : "Sleep"}
        </motion.button>
      </div>
      <motion.button type="button" className="sanctuary-encourage" whileTap={{ scale: 0.98 }} onClick={encourage}>
        <BookOpen size={18} /> Encourage Me <Sparkles size={16} />
      </motion.button>

      <div className="sanctuary-collection-header">
        <div><span className="sanctuary-eyebrow">CHOOSE YOUR COMPANION</span><h3>Meet the little friends <span>🐾</span></h3></div>
        <div className="sanctuary-page-controls">
          <button type="button" disabled={page === 0} onClick={() => setPage(0)} aria-label="Previous pets"><ChevronLeft size={17} /></button>
          <span>{page + 1} / 2</span>
          <button type="button" disabled={page === 1} onClick={() => setPage(1)} aria-label="Next pets"><ChevronRight size={17} /></button>
        </div>
      </div>
      <div className="sanctuary-pet-grid">
        {shownPets.map((item) => (
          <button key={item.id} type="button" onClick={() => choosePet(item.id)}
            aria-pressed={selected === item.id}
            className={`sanctuary-pet-card ${selected === item.id ? "is-selected" : ""}`}
            style={{ "--card-accent": item.color } as React.CSSProperties}>
            <span className="sanctuary-pet-emoji">{item.emoji}</span>
            <strong>{petStates[item.id].name}</strong>
            <small>{item.species}</small>
            {selected === item.id && <span className="sanctuary-selected-mark"><Check size={12} /></span>}
          </button>
        ))}
      </div>
      <p className="sanctuary-footer">Every little study session is better with a friend. 💜</p>
    </section>
  );
}
