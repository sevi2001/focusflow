
export type LetterTheme =
  | "pink"
  | "lavender"
  | "peach"
  | "mint"
  | "cream"
  | "blue";

export type LittleLetter = {
  id: string;
  title: string;
  sender: string;
  subtitle: string;
  greeting: string;
  message: string;
  signature: string;
  emoji: string;
  stamp: string;
  stickers: string[];
  theme: LetterTheme;
  rotation: number;
};

export const littleLetters: LittleLetter[] = [
  {
    id: "dear-dreamer",
    title: "Dear Dreamer",
    sender: "Lily",
    subtitle: "A little reminder",
    greeting: "Dear Dreamer,",
    message:
      "One day, you'll look back at these quiet study nights and realize they were the beginning of something beautiful. Keep going, your dreams are growing.",
    signature: "With love, Lily ♡",
    emoji: "🎀",
    stamp: "🌷",
    stickers: ["🌸", "✨", "🎀"],
    theme: "pink",
    rotation: -4,
  },
  {
    id: "moonlight-note",
    title: "Moonlight Note",
    sender: "The Moon",
    subtitle: "For the quiet nights",
    greeting: "Hello, Little Star,",
    message:
      "Even the brightest stars need darkness to shine. Take your time, trust your journey, and remember that you are allowed to grow at your own pace.",
    signature: "The Moon ✦",
    emoji: "🌙",
    stamp: "⭐",
    stickers: ["☁️", "⭐", "✨"],
    theme: "lavender",
    rotation: 3,
  },
  {
    id: "little-joys",
    title: "Little Joys",
    sender: "Mochi",
    subtitle: "A tiny happy note",
    greeting: "Hey, Sunshine!",
    message:
      "You finished another little step! That's something worth celebrating. Drink some water, stretch your shoulders, and give yourself a tiny smile.",
    signature: "Purrs, Mochi 🐾",
    emoji: "🍓",
    stamp: "🍰",
    stickers: ["🍓", "💗", "🐾"],
    theme: "peach",
    rotation: -3,
  },
  {
    id: "keep-blooming",
    title: "Keep Blooming",
    sender: "The Garden",
    subtitle: "A note for your growth",
    greeting: "Dear Little Flower,",
    message:
      "Flowers don't bloom all at once. Some days you grow quietly, and some days you shine. Both kinds of days matter. Keep blooming.",
    signature: "Your Little Garden 🌿",
    emoji: "🌷",
    stamp: "🦋",
    stickers: ["🌼", "🦋", "🍃"],
    theme: "mint",
    rotation: 4,
  },
  {
    id: "cozy-study",
    title: "Cozy Study Note",
    sender: "Your Study Buddy",
    subtitle: "One page at a time",
    greeting: "Dear Study Buddy,",
    message:
      "You don't need to finish everything today. Just focus on the next small thing. One page, one idea, one little victory at a time.",
    signature: "Cheering for you ☕",
    emoji: "☕",
    stamp: "📚",
    stickers: ["📖", "🧸", "✨"],
    theme: "cream",
    rotation: -2,
  },
  {
    id: "future-you",
    title: "From Future You",
    sender: "Future You",
    subtitle: "A letter across time",
    greeting: "Dear Me,",
    message:
      "Thank you for showing up, even when it wasn't easy. Every effort you make today is helping me become the person we dreamed of being.",
    signature: "With love, Future You ♡",
    emoji: "💌",
    stamp: "🪄",
    stickers: ["💫", "💖", "⭐"],
    theme: "blue",
    rotation: 3,
  },
];
