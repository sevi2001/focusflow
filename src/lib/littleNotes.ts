
export const LITTLE_NOTES_KEY = "focusflow_my_little_notes_v1";

/* ==========================================
   POSTCARD PAPER THEMES — 20 COLORS
========================================== */

export type NoteTheme =
  | "pink"
  | "lavender"
  | "peach"
  | "mint"
  | "cream"
  | "blue"
  | "rose"
  | "lilac"
  | "butter"
  | "sage"
  | "sky"
  | "coral"
  | "cotton"
  | "matcha"
  | "dusty"
  | "periwinkle"
  | "strawberry"
  | "vanilla"
  | "seafoam"
  | "dreamy";

/* ==========================================
   POSTCARD DATA STRUCTURE
========================================== */

export type LittleNote = {
  id: string;
  title: string;
  message: string;
  theme: NoteTheme;
  sticker: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
};

/* ==========================================
   AVAILABLE POSTCARD COLORS
========================================== */

export const themes: NoteTheme[] = [
  // Original colors
  "pink",
  "lavender",
  "peach",
  "mint",
  "cream",
  "blue",

  // New pastel colors
  "rose",
  "lilac",
  "butter",
  "sage",
  "sky",
  "coral",
  "cotton",
  "matcha",
  "dusty",
  "periwinkle",
  "strawberry",
  "vanilla",
  "seafoam",
  "dreamy",
];

/* ==========================================
   COLOR LABELS FOR THE POSTCARD EDITOR
========================================== */

export const NOTE_THEME_OPTIONS: {
  id: NoteTheme;
  label: string;
}[] = [
  { id: "pink", label: "Blush Pink" },
  { id: "lavender", label: "Lavender" },
  { id: "peach", label: "Peach" },
  { id: "mint", label: "Mint" },
  { id: "cream", label: "Cream" },
  { id: "blue", label: "Baby Blue" },
  { id: "rose", label: "Rose Pink" },
  { id: "lilac", label: "Lilac Dream" },
  { id: "butter", label: "Butter Yellow" },
  { id: "sage", label: "Sage Green" },
  { id: "sky", label: "Sky Blue" },
  { id: "coral", label: "Soft Coral" },
  { id: "cotton", label: "Cotton Candy" },
  { id: "matcha", label: "Matcha Green" },
  { id: "dusty", label: "Dusty Pink" },
  { id: "periwinkle", label: "Periwinkle" },
  { id: "strawberry", label: "Strawberry Milk" },
  { id: "vanilla", label: "Vanilla Cream" },
  { id: "seafoam", label: "Seafoam" },
  { id: "dreamy", label: "Dreamy Purple" },
];

/* ==========================================
   CUTE POSTCARD STICKERS — 72 STICKERS
========================================== */

export const NOTE_STICKERS: string[] = [
  // Cute & girly
  "🎀", "💗", "💖", "💕", "💌", "🩷",
  "🧸", "🪞", "👑", "💎", "🪄", "🫧",

  // Flowers & nature
  "🌷", "🌸", "🌹", "🌻", "🌼", "💐",
  "🍀", "🌿", "🍄", "🦋", "🐝", "🌈",

  // Cute animals
  "🐱", "🐰", "🐻", "🐼", "🦊", "🐣",
  "🐶", "🐹", "🦄", "🐥", "🦢", "🐾",

  // Food & treats
  "🍓", "🍒", "🍑", "🍰", "🧁", "🍪",
  "🍩", "🍬", "🍭", "☕", "🧋", "🍯",

  // Moon & magic
  "🌙", "⭐", "✨", "🌟", "☁️", "🌠",
  "🪐", "🔮", "🕯️", "🗝️", "🧚", "💫",

  // Study & memories
  "📖", "📚", "✏️", "📝", "🎨", "📸",
  "🎧", "🎵", "🧶", "🪴", "🪻", "🕊️",
];

/* ==========================================
   VALIDATE POSTCARD DATA
========================================== */

function isLittleNote(value: unknown): value is LittleNote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Record<string, unknown>;

  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.message === "string" &&
    typeof note.theme === "string" &&
    themes.includes(note.theme as NoteTheme) &&
    typeof note.sticker === "string" &&
    typeof note.favorite === "boolean" &&
    typeof note.createdAt === "number" &&
    typeof note.updatedAt === "number"
  );
}

/* ==========================================
   LOAD EXISTING POSTCARDS
========================================== */

export function loadLittleNotes(): LittleNote[] {
  try {
    const raw = localStorage.getItem(LITTLE_NOTES_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLittleNote);
  } catch {
    return [];
  }
}

/* ==========================================
   SAVE LEGACY POSTCARDS
========================================== */

/*
  This function is retained for compatibility
  with your existing project.

  IMPORTANT:
  Your private Secret Letters editor should
  save through saveVaultNotes() in secretVault.ts,
  not through this unencrypted function.
*/

export function saveLittleNotes(
  notes: LittleNote[]
): boolean {
  try {
    localStorage.setItem(
      LITTLE_NOTES_KEY,
      JSON.stringify(notes)
    );

    return true;
  } catch {
    return false;
  }
}
