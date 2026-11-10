
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  Eye,
  Heart,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  NOTE_THEME_OPTIONS,
  NOTE_STICKERS,
  type LittleNote,
  type NoteTheme,
} from "../lib/littleNotes";

import "./MyLittleNotes.css";

const COLORS = NOTE_THEME_OPTIONS;
const STICKERS = NOTE_STICKERS;

type EditorData = {
  title: string;
  message: string;
  theme: NoteTheme;
  sticker: string;
};

const emptyEditor = (): EditorData => ({
  title: "",
  message: "",
  theme: "pink",
  sticker: "🎀",
});

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Props = {
  initialNotes: LittleNote[];
  onPersist: (notes: LittleNote[]) => Promise<boolean>;
};

export default function MyLittleNotes({ initialNotes, onPersist }: Props) {
  const reducedMotion = useReducedMotion();

  const [notes, setNotes] = useState<LittleNote[]>(initialNotes);

  const [editor, setEditor] = useState<EditorData>(
    emptyEditor
  );

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [isWriting, setIsWriting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [status, setStatus] = useState("");

  // Notes are supplied only after the encrypted vault is unlocked.

  const visibleNotes = useMemo(() => {
  const safeNotes = Array.isArray(notes) ? notes : [];

  const filtered = favoritesOnly
    ? safeNotes.filter((note) => note.favorite)
    : safeNotes;

  return [...filtered].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}, [notes, favoritesOnly]);

  const updateEditor = <K extends keyof EditorData>(
    key: K,
    value: EditorData[K]
  ) => {
    setEditor((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const startNew = () => {
    setEditor(emptyEditor());
    setEditingId(null);
    setPreview(false);
    setStatus("");
    setIsWriting(true);
  };

  const startEditing = (note: LittleNote) => {
    setEditor({
      title: note.title,
      message: note.message,
      theme: note.theme,
      sticker: note.sticker,
    });

    setEditingId(note.id);
    setPreview(false);
    setStatus("");
    setIsWriting(true);

    document.getElementById("my-notes-editor")
      ?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "start",
      });
  };

  const closeEditor = () => {
    setIsWriting(false);
    setEditingId(null);
    setPreview(false);
    setEditor(emptyEditor());
  };

  const saveNote = async () => {
    const title = editor.title.trim();
    const message = editor.message.trim();

    if (!title || !message) {
      setStatus("Please add a title and a message first. 💌");
      return;
    }

    const now = Date.now();
    const existing = notes.find(
      (note) => note.id === editingId
    );

    const note: LittleNote = {
      id: existing?.id ?? createId(),
      title,
      message,
      theme: editor.theme,
      sticker: editor.sticker,
      favorite: existing?.favorite ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const next = existing
      ? notes.map((item) =>
          item.id === existing.id ? note : item
        )
      : [note, ...notes];

    if (!(await onPersist(next))) {
      setStatus(
        "Couldn't save your note. Check browser storage and try again."
      );
      return;
    }

    setNotes(next);
    closeEditor();
    setStatus("Your little postcard was saved! 💖");
  };

  const toggleFavorite = async (id: string) => {
    const next = notes.map((note) =>
      note.id === id
        ? { ...note, favorite: !note.favorite }
        : note
    );

    if (await onPersist(next)) {
      setNotes(next);
    } else {
      setStatus("Couldn't update favorites.");
    }
  };

  const deleteNote = async (id: string) => {
    const note = notes.find((item) => item.id === id);
    if (!note) return;

    if (
      !window.confirm(
        `Delete "${note.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const next = notes.filter((item) => item.id !== id);

    if (await onPersist(next)) {
      setNotes(next);
      setStatus("Postcard deleted.");
    } else {
      setStatus("Couldn't delete this postcard.");
    }
  };

  return (
    <section className="my-notes-section" id="my-little-notes">
      <div className="my-notes-heading">
        <div>
          <span className="my-notes-eyebrow">
            ✨ YOUR OWN LITTLE CORNER
          </span>
          <h2>My Little Notes 💌</h2>
          <p>
            Write your thoughts, decorate a postcard,
            and keep your memories close.
          </p>
        </div>

        <button
          type="button"
          className="my-notes-create"
          onClick={startNew}
        >
          <Plus size={17} />
          Write a Postcard
        </button>
      </div>

      {status && (
        <p className="my-notes-status" role="status">
          {status}
        </p>
      )}

      {isWriting && (
        <motion.div
          id="my-notes-editor"
          className="my-notes-editor"
          initial={
            reducedMotion
              ? false
              : { opacity: 0, y: 20 }
          }
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="my-notes-editor-heading">
            <div>
              <h3>
                {editingId
                  ? "Edit Your Postcard"
                  : "Create a Little Postcard"}
              </h3>
              <p>Make something lovely ♡</p>
            </div>

            <button
              type="button"
              className="my-notes-close"
              onClick={closeEditor}
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>

          <div className="my-notes-editor-grid">
            <div className="my-notes-controls">
              <label htmlFor="little-note-title">
                Postcard title
              </label>

              <input
                id="little-note-title"
                maxLength={80}
                value={editor.title}
                onChange={(event) =>
                  updateEditor(
                    "title",
                    event.target.value
                  )
                }
                placeholder="A letter to myself..."
              />

              <label htmlFor="little-note-message">
                Your message
              </label>

              <textarea
                id="little-note-message"
                maxLength={3000}
                rows={8}
                value={editor.message}
                onChange={(event) =>
                  updateEditor(
                    "message",
                    event.target.value
                  )
                }
                placeholder={
                  "Dear me,\n\nToday I want to remember..."
                }
              />

              <span className="my-notes-character-count">
                {editor.message.length}/3000 characters
              </span>

              <span className="my-notes-control-label">
                Choose paper color
              </span>

              <div className="my-notes-colors">
                {COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`my-notes-color color-${color.id} ${
                      editor.theme === color.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      updateEditor("theme", color.id)
                    }
                    title={color.label}
                    aria-label={color.label}
                    aria-pressed={
                      editor.theme === color.id
                    }
                  >
                    {editor.theme === color.id && (
                      <Check size={16} />
                    )}
                  </button>
                ))}
              </div>

              <span className="my-notes-control-label">
                Pick a cute sticker
              </span>

              <div className="my-notes-stickers">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    className={
                      editor.sticker === sticker
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      updateEditor("sticker", sticker)
                    }
                    aria-label={`Sticker ${sticker}`}
                    aria-pressed={
                      editor.sticker === sticker
                    }
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-notes-preview-area">
              <div className="my-notes-preview-toolbar">
                <strong>Postcard preview</strong>

                <button
                  type="button"
                  onClick={() =>
                    setPreview((previous) => !previous)
                  }
                >
                  <Eye size={15} />
                  {preview ? "Editing" : "Preview"}
                </button>
              </div>

              <div
                className={`my-notes-paper paper-${editor.theme}`}
              >
                <div className="my-notes-paper-top">
                  <span className="my-notes-paper-sticker">
                    {editor.sticker}
                  </span>

                  <span className="my-notes-paper-stamp">
                    POSTCARD ♡
                  </span>
                </div>

                <div className="my-notes-paper-rule" />

                <h3>
                  {editor.title ||
                    "A little letter to myself"}
                </h3>

                <p>
                  {editor.message ||
                    "Your beautiful thoughts will appear here..."}
                </p>

                <div className="my-notes-paper-bottom">
                  <span>✦ ♡ ✦</span>
                  <span>With love, Me ♡</span>
                </div>
              </div>

              {preview && (
                <p className="my-notes-preview-hint">
                  ✨ This is how your saved postcard
                  will look in the garden.
                </p>
              )}
            </div>
          </div>

          <div className="my-notes-editor-actions">
            <button
              type="button"
              className="my-notes-cancel"
              onClick={closeEditor}
            >
              Cancel
            </button>

            <button
              type="button"
              className="my-notes-save"
              onClick={saveNote}
            >
              <Save size={17} />
              {editingId
                ? "Save Changes"
                : "Save My Postcard"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="my-notes-collection-header">
        <div>
          <h3>My Postcard Collection 🌷</h3>
          <span>
            {notes.length} saved{" "}
            {notes.length === 1
              ? "postcard"
              : "postcards"}
          </span>
        </div>

        <button
          type="button"
          className={`my-notes-filter ${
            favoritesOnly ? "active" : ""
          }`}
          onClick={() =>
            setFavoritesOnly((previous) => !previous)
          }
          aria-pressed={favoritesOnly}
        >
          <Heart size={15} />
          {favoritesOnly
            ? "Show All"
            : "Favorites"}
        </button>
      </div>

      {visibleNotes.length === 0 ? (
        <div className="my-notes-empty">
          <span>💌</span>
          <h3>
            {favoritesOnly
              ? "No favorite postcards yet"
              : "Your postcard garden is waiting"}
          </h3>
          <p>
            {favoritesOnly
              ? "Tap a heart on a saved postcard to keep it here."
              : "Write your first little note and watch your collection bloom."}
          </p>

          <button
            type="button"
            onClick={
              favoritesOnly
                ? () => setFavoritesOnly(false)
                : startNew
            }
          >
            {favoritesOnly
              ? "View All Postcards"
              : "Write My First Postcard"}
          </button>
        </div>
      ) : (
        <div className="my-notes-gallery">
          {visibleNotes.map((note, index) => (
            <motion.article
              key={note.id}
              className="my-notes-gallery-item"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reducedMotion
                  ? 0
                  : Math.min(index * 0.07, 0.35),
              }}
            >
              <motion.div
                className="my-notes-floating-paper"
                animate={
                  reducedMotion
                    ? undefined
                    : { y: [0, -6, 0] }
                }
                transition={{
                  duration: 5 + (index % 3),
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div
                  className={`my-notes-paper paper-${note.theme}`}
                >
                  <div className="my-notes-paper-top">
                    <span className="my-notes-paper-sticker">
                      {note.sticker}
                    </span>

                    <span className="my-notes-paper-stamp">
                      MY LETTER ✦
                    </span>
                  </div>

                  <div className="my-notes-paper-rule" />

                  <h3>{note.title}</h3>

                  <p>{note.message}</p>

                  <div className="my-notes-paper-bottom">
                    <span>
                      {new Date(
                        note.createdAt
                      ).toLocaleDateString()}
                    </span>
                    <span>With love, Me ♡</span>
                  </div>
                </div>
              </motion.div>

              <div className="my-notes-card-actions">
                <button
                  type="button"
                  onClick={() => startEditing(note)}
                  aria-label={`Edit ${note.title}`}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  className={
                    note.favorite ? "favorite" : ""
                  }
                  onClick={() =>
                    toggleFavorite(note.id)
                  }
                  aria-label={
                    note.favorite
                      ? `Remove ${note.title} from favorites`
                      : `Favorite ${note.title}`
                  }
                  aria-pressed={note.favorite}
                >
                  <Heart
                    size={16}
                    fill={
                      note.favorite
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>

                <button
                  type="button"
                  className="my-notes-delete"
                  onClick={() => deleteNote(note.id)}
                  aria-label={`Delete ${note.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
