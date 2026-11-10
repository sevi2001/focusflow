import { useEffect, useRef, useState } from "react";
import "./AmbientSounds.css";
import { motion } from "motion/react";
import { CloudRain, Coffee, Flame, Waves, Trees, Wind, Headphones, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Music2 } from "lucide-react";
import "./AmbientSounds.css";

type SoundId = "rain" | "cafe" | "fireplace" | "ocean" | "forest" | "wind";
type SoundVolumes = Record<SoundId, number>;
type Preferences = { volumes: SoundVolumes; masterVolume: number };
type Props = { isPlaying: boolean; onPlayingChange: (playing: boolean) => void };
const KEY = "focusflow_ambient_preferences";
const sounds = [
  { id: "rain", name: "Rainy Night", subtitle: "Rain against a cozy window", file: "/sounds/rain.mp3", icon: CloudRain, emoji: "🌧️" },
  { id: "cafe", name: "Cozy Café", subtitle: "Soft café chatter and cups", file: "/sounds/cafe.mp3", icon: Coffee, emoji: "☕" },
  { id: "fireplace", name: "Warm Fireplace", subtitle: "Gentle crackling flames", file: "/sounds/fireplace.mp3", icon: Flame, emoji: "🔥" },
  { id: "ocean", name: "Ocean Dreams", subtitle: "Slow, soothing ocean waves", file: "/sounds/ocean.mp3", icon: Waves, emoji: "🌊" },
  { id: "forest", name: "Enchanted Forest", subtitle: "Birdsong among the trees", file: "/sounds/forest.mp3", icon: Trees, emoji: "🌿" },
  { id: "wind", name: "Soft Breeze", subtitle: "A gentle evening breeze", file: "/sounds/wind.mp3", icon: Wind, emoji: "🍃" },
] as const;
const defaults: Preferences = { volumes: { rain: 65, cafe: 0, fireplace: 0, ocean: 0, forest: 0, wind: 0 }, masterVolume: 70 };
const presets: { name: string; emoji: string; volumes: SoundVolumes }[] = [
  { name: "Rainy Focus", emoji: "🌧️", volumes: { rain: 70, cafe: 0, fireplace: 20, ocean: 0, forest: 0, wind: 0 } },
  { name: "Cozy Study", emoji: "☕", volumes: { rain: 20, cafe: 65, fireplace: 25, ocean: 0, forest: 0, wind: 0 } },
  { name: "Dreamy Night", emoji: "🌙", volumes: { rain: 45, cafe: 0, fireplace: 40, ocean: 0, forest: 0, wind: 0 } },
  { name: "Ocean Escape", emoji: "🌊", volumes: { rain: 0, cafe: 0, fireplace: 0, ocean: 65, forest: 0, wind: 15 } },
  { name: "Forest Retreat", emoji: "🌿", volumes: { rain: 15, cafe: 0, fireplace: 0, ocean: 0, forest: 65, wind: 20 } },
];
const clamp = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const value = JSON.parse(raw) as Partial<Preferences>;
    const volumes = Object.fromEntries(sounds.map(sound => [sound.id, clamp(value.volumes?.[sound.id], defaults.volumes[sound.id])])) as SoundVolumes;
    return { volumes, masterVolume: clamp(value.masterVolume, defaults.masterVolume) };
  } catch { return defaults; }
}
export default function AmbientSounds({ isPlaying, onPlayingChange }: Props) {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const audioRefs = useRef<Partial<Record<SoundId, HTMLAudioElement>>>({});
  const requestRef = useRef(0);
  const { volumes, masterVolume } = preferences;
  const activeCount = sounds.filter(sound => volumes[sound.id] > 0).length;
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* storage unavailable */ } }, [preferences]);
  useEffect(() => {
    sounds.forEach(sound => {
      const audio = audioRefs.current[sound.id];
      if (!audio) return;
      audio.volume = muted ? 0 : (volumes[sound.id] / 100) * (masterVolume / 100);
      audio.loop = true;
    });
  }, [volumes, masterVolume, muted]);
  useEffect(() => {
    const request = ++requestRef.current;
    if (!isPlaying) {
      sounds.forEach(sound => audioRefs.current[sound.id]?.pause());
      return;
    }
    const play = async () => {
      const active = sounds.filter(sound => volumes[sound.id] > 0).map(sound => audioRefs.current[sound.id]).filter((audio): audio is HTMLAudioElement => !!audio);
      sounds.filter(sound => volumes[sound.id] === 0).forEach(sound => audioRefs.current[sound.id]?.pause());
      if (!active.length) { setError("Turn up at least one sound to begin."); onPlayingChange(false); return; }
      try {
        await Promise.all(active.map(audio => audio.play()));
        if (request !== requestRef.current) { active.forEach(audio => audio.pause()); return; }
        setError("");
      } catch {
        if (request !== requestRef.current) return;
        sounds.forEach(sound => audioRefs.current[sound.id]?.pause());
        setError("A sound could not play. Make sure its MP3 exists in public/sounds/ and try again.");
        onPlayingChange(false);
      }
    };
    void play();
    return () => { ++requestRef.current; };
  }, [isPlaying, volumes, onPlayingChange]);
  const setVolume = (id: SoundId, value: number) => setPreferences(old => ({ ...old, volumes: { ...old.volumes, [id]: value } }));
  const stopAll = () => { onPlayingChange(false); sounds.forEach(sound => { const audio = audioRefs.current[sound.id]; if (audio) { audio.pause(); audio.currentTime = 0; } }); };
  const reset = () => { setPreferences(defaults); setMuted(false); setError(""); };
  return (
    <section className="ambient-panel">
      {sounds.map(sound => <audio key={sound.id} ref={el => { if (el) audioRefs.current[sound.id] = el; else delete audioRefs.current[sound.id]; }} src={sound.file} preload="none" loop />)}
      <div className="ambient-header">
        <div className="ambient-brand"><span className="ambient-brand-icon"><Headphones size={23}/></span><div><span className="ambient-eyebrow">FOCUSFLOW AUDIO SPACE</span><h2>Dreamy Sound Studio <Sparkles size={17}/></h2><p>Mix a little magic into your study time</p></div></div>
        <span className="ambient-count">{activeCount} active</span>
      </div>
      <div className="ambient-hero"><div className="ambient-orb">🎧</div><div className="ambient-hero-copy"><span className="ambient-eyebrow">YOUR PERSONAL SOUNDSCAPE</span><strong>{isPlaying ? "Lost in your cozy world" : "Your calm begins here"}</strong><span>{isPlaying ? "Beautiful sounds are flowing" : "Choose a mix and press play"}</span></div><div className={`ambient-hero-bars ${isPlaying && !muted ? "is-playing" : ""}`} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i}/>)}</div></div>
      <div className="ambient-section-heading"><h3><Music2 size={17}/> Sound collection</h3><span>Mix multiple sounds</span></div>
      <div className="ambient-sounds-grid">{sounds.map(sound => {
        const Icon = sound.icon;
        const value = volumes[sound.id];
        const playing = isPlaying && !muted && masterVolume > 0 && value > 0;
        return <motion.div key={sound.id} whileHover={{ y: -3 }} className={`ambient-sound-card ${value > 0 ? "ambient-sound-active" : ""}`}>
          <div className="ambient-sound-top"><div className="ambient-sound-art"><span>{sound.emoji}</span><Icon size={16}/></div><div className="ambient-sound-info"><h4>{sound.name}</h4><p>{sound.subtitle}</p></div><div className={`ambient-equalizer ${playing ? "is-playing" : ""}`} aria-label={playing ? "Playing" : "Paused"}>{[0,1,2,3].map(i => <span key={i}/>)}</div></div>
          <div className="ambient-volume-row"><Volume2 size={16}/><input className="ambient-slider" type="range" min="0" max="100" value={value} onChange={e => setVolume(sound.id, Number(e.target.value))} aria-label={`${sound.name} volume`} style={{ background: `linear-gradient(to right, #c4b5fd ${value}%, rgba(255,255,255,.12) ${value}%)` }}/><span>{value}%</span></div>
        </motion.div>;
      })}</div>
      <div className="ambient-section-heading"><h3><Sparkles size={17}/> Dreamy presets</h3><span>One-tap sound mixes</span></div>
      <div className="ambient-presets">{presets.map(preset => <button key={preset.name} type="button" onClick={() => { setPreferences(old => ({ ...old, volumes: { ...preset.volumes } })); setError(""); }}><span>{preset.emoji}</span>{preset.name}</button>)}</div>
      <div className="ambient-master"><div className="ambient-master-heading"><div><strong>Master volume</strong><small>Control the whole atmosphere</small></div><button type="button" onClick={() => setMuted(v => !v)} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted}>{muted ? <VolumeX size={21}/> : <Volume2 size={21}/>}</button></div><div className="ambient-volume-row"><Volume2 size={16}/><input className="ambient-slider" type="range" min="0" max="100" value={masterVolume} onChange={e => setPreferences(old => ({ ...old, masterVolume: Number(e.target.value) }))} aria-label="Master volume" style={{ background: `linear-gradient(to right, #f8d99c ${masterVolume}%, rgba(255,255,255,.12) ${masterVolume}%)` }}/><span>{masterVolume}%</span></div></div>
      <div className="ambient-controls"><motion.button whileTap={{ scale: .96 }} className="ambient-play-button" type="button" onClick={() => onPlayingChange(!isPlaying)}>{isPlaying ? <Pause size={19}/> : <Play size={19}/>} {isPlaying ? "Pause ambience" : "Play ambience"}</motion.button><button type="button" className="ambient-secondary-button" onClick={stopAll}>Stop all</button><button type="button" className="ambient-secondary-button ambient-reset" onClick={reset} aria-label="Reset sound mix" title="Reset sound mix"><RotateCcw size={18}/></button></div>
      {error && <p className="ambient-error" role="alert">{error}</p>}
      <p className="ambient-note">✨ Your mix is saved automatically. New sounds require matching MP3 files in <code>public/sounds/</code>.</p>
    </section>
  );
}
