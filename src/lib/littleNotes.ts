
export const LITTLE_NOTES_KEY = "focusflow_my_little_notes_v1";

export type NoteTheme =
  | "pink"
  | "lavender"
  | "peach"
  | "mint"
  | "cream"
  | "blue";

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

const themes: NoteTheme[] = [
  "pink",
  "lavender",
  "peach",
  "mint",
  "cream",
  "blue",
];

function isLittleNote(value: unknown): value is LittleNote {
  if (!value || typeof value !== "object") return false;

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

export function loadLittleNotes(): LittleNote[] {
  try {
    const raw = localStorage.getItem(LITTLE_NOTES_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isLittleNote);
  } catch {
    return [];
  }
}

export function saveLittleNotes(notes: LittleNote[]): boolean {
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
