
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Heart,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UnlockKeyhole,
} from "lucide-react";

import MyLittleNotes from "./MyLittleNotes";
import type { LittleNote } from "../lib/littleNotes";

import {
  createVault,
  hasLegacyNotes,
  loadLegacyNotes,
  migrateLegacyNotes,
  saveVaultNotes,
  unlockVault,
  vaultExists,
} from "../lib/secretVault";

import "./SecretLettersVault.css";

type Session = {
  password: string;
  notes: LittleNote[];
};

const AUTO_LOCK_MS = 5 * 60 * 1000;

export default function SecretLettersVault() {
  const [exists, setExists] = useState(() => vaultExists());

  const [session, setSession] = useState<Session | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [legacyPresent, setLegacyPresent] = useState(
    () => hasLegacyNotes()
  );

  const activityRef = useRef(Date.now());
  const busyRef = useRef(false);

  const lockVault = useCallback(() => {
    setSession(null);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  }, []);

  // Automatically lock the vault after five minutes
  // without user activity.
  useEffect(() => {
    if (!session) return;

    const recordActivity = () => {
      activityRef.current = Date.now();
    };

    activityRef.current = Date.now();

    const events = [
      "pointerdown",
      "keydown",
      "touchstart",
    ] as const;

    events.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity);
    });

    const interval = window.setInterval(() => {
      if (busyRef.current) return;

      if (
        Date.now() - activityRef.current >= AUTO_LOCK_MS
      ) {
        lockVault();
      }
    }, 10000);

    return () => {
      window.clearInterval(interval);

      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          recordActivity
        );
      });
    };
  }, [session !== null, lockVault]);

  // Lock when the browser tab becomes hidden.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        lockVault();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [lockVault]);

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (busyRef.current) return;

    setError("");
    setMessage("");

    if (password.length < 12) {
      setError(
        "Please use a password with at least 12 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    busyRef.current = true;
    setBusy(true);

    try {
      if (vaultExists()) {
        setExists(true);
        throw new Error(
          "A vault already exists. Please unlock it instead."
        );
      }

      // Read existing notes before creating the vault.
      // If the old data is malformed, creation stops.
      const oldNotes = hasLegacyNotes()
        ? loadLegacyNotes()
        : [];

      await createVault(password, oldNotes);

      // Verify that the encrypted vault can be opened.
      const verifiedNotes = await unlockVault(password);

      if (!Array.isArray(verifiedNotes)) {
        throw new Error(
          "Vault verification did not return a postcard collection."
        );
      }

      // Migration verifies the encrypted copy before
      // removing the old plaintext storage entry.
      const migratedNotes = hasLegacyNotes()
        ? await migrateLegacyNotes(password)
        : verifiedNotes;

      setSession({
        password,
        notes: migratedNotes,
      });

      setExists(true);
      setLegacyPresent(hasLegacyNotes());
      setPassword("");
      setConfirmPassword("");

      setMessage("Your secret diary is ready! 💖");
    } catch (err) {
      setExists(vaultExists());

      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create your vault."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleUnlock = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (busyRef.current) return;

    setError("");
    setMessage("");

    busyRef.current = true;
    setBusy(true);

    try {
      const unlockedNotes = await unlockVault(password);

      if (!Array.isArray(unlockedNotes)) {
        throw new Error(
          "Vault data is invalid. No notes were changed."
        );
      }

      // Migrate any remaining old postcards after
      // successfully unlocking the existing vault.
      const notes = hasLegacyNotes()
        ? await migrateLegacyNotes(password)
        : unlockedNotes;

      setSession({
        password,
        notes,
      });

      setLegacyPresent(hasLegacyNotes());
      setPassword("");
      setMessage("Welcome back to your secret garden! 🌷");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to unlock your diary."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handlePersist = async (
    nextNotes: LittleNote[]
  ): Promise<boolean> => {
    if (!session || busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);

    try {
      await saveVaultNotes(
        nextNotes,
        session.password
      );

      setSession((previous) =>
        previous
          ? { ...previous, notes: nextNotes }
          : null
      );

      activityRef.current = Date.now();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save encrypted postcards."
      );
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (session) {
    return (
      <section className="secret-vault-unlocked">
        <div className="secret-vault-toolbar">
          <div>
            <span className="secret-vault-eyebrow">
              <ShieldCheck size={15} />
              PRIVATE & ENCRYPTED
            </span>

            <h2>My Secret Letters 💌</h2>

            <p>
              Your private postcard garden is unlocked.
            </p>
          </div>

          <button
            type="button"
            className="secret-vault-lock-button"
            onClick={lockVault}
            disabled={busy}
          >
            <LockKeyhole size={17} />
            Lock My Diary
          </button>
        </div>

        {error && (
          <p className="secret-vault-error" role="alert">
            {error}
          </p>
        )}

        <MyLittleNotes
          initialNotes={session.notes}
          onPersist={handlePersist}
        />
      </section>
    );
  }

  return (
    <section className="secret-vault-section">
      <motion.div
        className="secret-vault-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="secret-vault-decoration">
          ✨ 🌸 ✨
        </div>

        <div className="secret-vault-icon">
          {exists ? (
            <LockKeyhole size={38} />
          ) : (
            <Heart size={38} />
          )}
        </div>

        <span className="secret-vault-eyebrow">
          <Sparkles size={14} />
          YOUR PRIVATE LITTLE WORLD
        </span>

        <h2>
          {exists
            ? "My Secret Letters"
            : "Create Your Secret Diary"}
        </h2>

        <p className="secret-vault-description">
          {exists
            ? "A little garden of thoughts meant only for you. Enter your password to unlock your postcards."
            : "Create a secret password to protect your precious memories, dreams, and little letters."}
        </p>

        {legacyPresent && (
          <div className="secret-vault-migration">
            💌 Existing postcards were found.
            They will be moved into your encrypted
            diary after successful verification.
          </div>
        )}

        <form
          className="secret-vault-form"
          onSubmit={
            exists ? handleUnlock : handleCreate
          }
        >
          <label htmlFor="secret-vault-password">
            <KeyRound size={15} />
            Secret Password
          </label>

          <input
            id="secret-vault-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your secret password"
            autoComplete={
              exists
                ? "current-password"
                : "new-password"
            }
            required
            minLength={exists ? 1 : 12}
          />

          {!exists && (
            <>
              <label htmlFor="secret-vault-confirm">
                <Heart size={15} />
                Confirm Password
              </label>

              <input
                id="secret-vault-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                minLength={12}
              />
            </>
          )}

          {error && (
            <p
              className="secret-vault-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className="secret-vault-message"
              role="status"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="secret-vault-submit"
            disabled={busy}
          >
            {busy ? (
              "Please wait..."
            ) : exists ? (
              <>
                <UnlockKeyhole size={18} />
                Unlock My Diary
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Create My Secret Diary
              </>
            )}
          </button>
        </form>

        <p className="secret-vault-footer">
          🔐 Your postcards are encrypted before
          they're stored in this browser.
        </p>

        <p className="secret-vault-warning">
          Keep your password safe. Forgotten passwords
          cannot be recovered.
        </p>
      </motion.div>
    </section>
  );
}
