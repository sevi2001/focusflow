
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  CloudRain,
  Coffee,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Headphones,
} from "lucide-react";

import "./AmbientSounds.css";

type SoundId = "rain" | "cafe" | "fireplace";

type SoundVolumes = Record<SoundId, number>;

type SoundPreferences = {
  volumes: SoundVolumes;
  masterVolume: number;
};

type AmbientSoundsProps = {
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
};

const STORAGE_KEY = "focusflow_ambient_preferences";

const sounds = [
  {
    id: "rain" as const,
    name: "Rainy Night",
    description: "Gentle rain against the window",
    icon: CloudRain,
    file: "/sounds/rain.mp3",
    color: "text-sky-300",
    background: "bg-sky-400/10",
  },
  {
    id: "cafe" as const,
    name: "Cozy Café",
    description: "Peaceful coffee shop atmosphere",
    icon: Coffee,
    file: "/sounds/cafe.mp3",
    color: "text-amber-300",
    background: "bg-amber-400/10",
  },
  {
    id: "fireplace" as const,
    name: "Warm Fireplace",
    description: "Soft crackling fire sounds",
    icon: Flame,
    file: "/sounds/fireplace.mp3",
    color: "text-orange-300",
    background: "bg-orange-400/10",
  },
];

const defaultPreferences: SoundPreferences = {
  volumes: {
    rain: 65,
    cafe: 0,
    fireplace: 0,
  },
  masterVolume: 70,
};

function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
}

function readPreferences(): SoundPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return defaultPreferences;

    const parsed = JSON.parse(stored) as Partial<SoundPreferences>;

    return {
      masterVolume: clampVolume(
        parsed.masterVolume,
        defaultPreferences.masterVolume
      ),
      volumes: {
        rain: clampVolume(
          parsed.volumes?.rain,
          defaultPreferences.volumes.rain
        ),
        cafe: clampVolume(
          parsed.volumes?.cafe,
          defaultPreferences.volumes.cafe
        ),
        fireplace: clampVolume(
          parsed.volumes?.fireplace,
          defaultPreferences.volumes.fireplace
        ),
      },
    };
  } catch {
    return defaultPreferences;
  }
}

export default function AmbientSounds({
  isPlaying,
  onPlayingChange,
}: AmbientSoundsProps) {
  const [preferences, setPreferences] =
    useState<SoundPreferences>(readPreferences);

  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  const audioRefs = useRef<
    Partial<Record<SoundId, HTMLAudioElement>>
  >({});

  const playRequestRef = useRef(0);

  const { volumes, masterVolume } = preferences;

  // Save sound preferences.
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

  // Apply individual and master volumes.
  useEffect(() => {
    sounds.forEach((sound) => {
      const audio = audioRefs.current[sound.id];

      if (!audio) return;

      const individual = volumes[sound.id] / 100;
      const master = masterVolume / 100;

      audio.volume = muted ? 0 : individual * master;
      audio.loop = true;
    });
  }, [volumes, masterVolume, muted]);

  // Synchronize audio playback with the Study Room button.
  useEffect(() => {
    const requestId = ++playRequestRef.current;

    if (!isPlaying) {
      sounds.forEach((sound) => {
        audioRefs.current[sound.id]?.pause();
      });
      return;
    }

    const startSounds = async () => {
      try {
        const activeAudios = sounds
          .filter((sound) => volumes[sound.id] > 0)
          .map((sound) => audioRefs.current[sound.id])
          .filter(
            (audio): audio is HTMLAudioElement =>
              audio !== undefined
          );

        sounds.forEach((sound) => {
          if (volumes[sound.id] === 0) {
            audioRefs.current[sound.id]?.pause();
          }
        });

        if (activeAudios.length === 0) {
          setError("Increase a sound volume to hear ambience.");
          onPlayingChange(false);
          return;
        }

        await Promise.all(
          activeAudios.map((audio) => audio.play())
        );

        if (requestId !== playRequestRef.current) {
          activeAudios.forEach((audio) => audio.pause());
          return;
        }

        setError("");
      } catch {
        if (requestId !== playRequestRef.current) return;

        sounds.forEach((sound) => {
          audioRefs.current[sound.id]?.pause();
        });

        setError(
          "Unable to play audio. Check your sound files and try again."
        );
        onPlayingChange(false);
      }
    };

    void startSounds();

    return () => {
      ++playRequestRef.current;
    };
  }, [isPlaying, volumes, onPlayingChange]);

  const updateVolume = (id: SoundId, value: number) => {
    setPreferences((previous) => ({
      ...previous,
      volumes: {
        ...previous.volumes,
        [id]: value,
      },
    }));
  };

  const updateMasterVolume = (value: number) => {
    setPreferences((previous) => ({
      ...previous,
      masterVolume: value,
    }));
  };

  const stopAll = () => {
    onPlayingChange(false);

    sounds.forEach((sound) => {
      const audio = audioRefs.current[sound.id];

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  const resetMix = () => {
    setPreferences(defaultPreferences);
    setMuted(false);
    setError("");
  };

  const activeSounds = sounds.filter(
    (sound) => volumes[sound.id] > 0
  ).length;

  return (
    <div className="ambient-panel">
      {/* Hidden audio players */}
      {sounds.map((sound) => (
        <audio
          key={sound.id}
          ref={(element) => {
            if (element) {
              audioRefs.current[sound.id] = element;
            } else {
              delete audioRefs.current[sound.id];
            }
          }}
          src={sound.file}
          preload="none"
          loop
        />
      ))}

      {/* Header */}
      <div className="ambient-header">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-purple-400/10 p-3 text-purple-200">
            <Headphones size={23} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Ambient Sounds
            </h2>
            <p className="text-xs text-slate-400">
              Create your perfect cozy atmosphere
            </p>
          </div>
        </div>

        <span className="ambient-count">
          {activeSounds} active
        </span>
      </div>

      {/* Sound cards */}
      <div className="mt-6 space-y-3">
        {sounds.map((sound) => {
          const Icon = sound.icon;
          const volume = volumes[sound.id];
          const active = volume > 0;

          return (
            <motion.div
              key={sound.id}
              whileHover={{ y: -2 }}
              className={`ambient-sound-card ${
                active ? "ambient-sound-active" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-3 ${sound.background} ${sound.color}`}
                >
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    {sound.name}
                  </h3>

                  <p className="text-xs text-slate-400">
                    {sound.description}
                  </p>
                </div>

                {active && isPlaying && !muted && masterVolume > 0 && (
                  <div
                    className="ambient-equalizer"
                    aria-label="Sound playing"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Volume2
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  aria-label={`${sound.name} volume`}
                  onChange={(event) =>
                    updateVolume(
                      sound.id,
                      Number(event.target.value)
                    )
                  }
                  className="ambient-slider"
                  style={{
                    background: `linear-gradient(
                      to right,
                      #fcd34d ${volume}%,
                      rgba(255,255,255,0.12) ${volume}%
                    )`,
                  }}
                />

                <span className="w-9 text-right text-xs tabular-nums text-amber-200">
                  {volume}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Master volume */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            Master Volume
          </span>

          <button
            onClick={() => setMuted((previous) => !previous)}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            className="text-amber-200 transition hover:text-amber-100"
          >
            {muted ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            aria-label="Master volume"
            onChange={(event) =>
              updateMasterVolume(Number(event.target.value))
            }
            className="ambient-slider"
          />

          <span className="w-10 text-right text-xs tabular-nums text-amber-200">
            {masterVolume}%
          </span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="mt-6 flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onPlayingChange(!isPlaying)}
          className="ambient-play-button"
        >
          {isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}

          {isPlaying ? "Pause Sounds" : "Play Sounds"}
        </motion.button>

        <button
          onClick={stopAll}
          className="ambient-secondary-button"
        >
          Stop All
        </button>

        <button
          onClick={resetMix}
          aria-label="Reset sound mix"
          title="Reset sound mix"
          className="ambient-secondary-button"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-400/10 p-3 text-xs text-rose-200"
        >
          {error}
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Mix multiple sounds together. Your volume settings
        are saved automatically.
      </p>
    </div>
  );
}
