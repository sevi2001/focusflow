
import {
  calculateStreak,
  getStudyHistory,
  type StudyHistory,
} from "./studyStats";

export const REWARDS_KEY = "focusflow_magical_rewards_v1";
export const REWARDS_EVENT = "focusflow:rewards-updated";
export const TASKS_KEY = "focusflow_daily_tasks";

export const REWARD_RATES = {
  session: 20,
  task: 5,
  dailyGoal: 30,
  sevenDayStreak: 100,
} as const;

export type ShopCategory = "pet" | "girl" | "room";

export type ShopItem = {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  emoji: string;
  description: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "pet-pink-bow",
    name: "Pink Bow",
    category: "pet",
    price: 40,
    emoji: "🎀",
    description: "A sweet bow for your little companion.",
  },
  {
    id: "pet-golden-crown",
    name: "Golden Crown",
    category: "pet",
    price: 100,
    emoji: "👑",
    description: "Royal style for your study buddy.",
  },
  {
    id: "pet-cozy-scarf",
    name: "Cozy Scarf",
    category: "pet",
    price: 60,
    emoji: "🧣",
    description: "A warm accessory for cozy days.",
  },
  {
    id: "girl-headphones",
    name: "Pastel Headphones",
    category: "girl",
    price: 75,
    emoji: "🎧",
    description: "Perfect for a focused study session.",
  },
  {
    id: "girl-purple-sweater",
    name: "Lavender Sweater",
    category: "girl",
    price: 90,
    emoji: "💜",
    description: "A soft and dreamy study outfit.",
  },
  {
    id: "girl-flower",
    name: "Flower Hair Clip",
    category: "girl",
    price: 45,
    emoji: "🌸",
    description: "A cute floral accessory.",
  },
  {
    id: "room-moon-lamp",
    name: "Moon Lamp",
    category: "room",
    price: 120,
    emoji: "🌙",
    description: "Give your study room a magical glow.",
  },
  {
    id: "room-fairy-lights",
    name: "Fairy Lights",
    category: "room",
    price: 85,
    emoji: "✨",
    description: "Add sparkling lights to your room.",
  },
  {
    id: "room-plant",
    name: "Cozy Plant",
    category: "room",
    price: 50,
    emoji: "🪴",
    description: "A little greenery for your desk.",
  },
];

export type RewardsState = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  claimed: string[];
  purchased: string[];
  equipped: Record<ShopCategory, string | null>;
};

type StoredTask = {
  id: string;
  date: string;
  completed: boolean;
};

export type PurchaseResult = {
  success: boolean;
  message: string;
};

function emptyRewards(): RewardsState {
  return {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    claimed: [],
    purchased: [],
    equipped: {
      pet: null,
      girl: null,
      room: null,
    },
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value.filter(
      (item): item is string => typeof item === "string"
    )
  )];
}

export function getRewards(): RewardsState {
  if (typeof window === "undefined") {
    return emptyRewards();
  }

  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) return emptyRewards();

    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") {
      return emptyRewards();
    }

    const data = value as Partial<RewardsState>;
    const defaults = emptyRewards();

    const balance =
      typeof data.balance === "number" &&
      Number.isSafeInteger(data.balance) &&
      data.balance >= 0
        ? data.balance
        : 0;

    const totalEarned =
      typeof data.totalEarned === "number" &&
      Number.isSafeInteger(data.totalEarned) &&
      data.totalEarned >= 0
        ? data.totalEarned
        : 0;

    const totalSpent =
      typeof data.totalSpent === "number" &&
      Number.isSafeInteger(data.totalSpent) &&
      data.totalSpent >= 0
        ? data.totalSpent
        : 0;

    const purchased = readStringArray(data.purchased);
    const equipped = { ...defaults.equipped };

    for (const category of ["pet", "girl", "room"] as const) {
      const itemId = data.equipped?.[category];

      if (
        typeof itemId === "string" &&
        purchased.includes(itemId) &&
        SHOP_ITEMS.some(
          (item) =>
            item.id === itemId && item.category === category
        )
      ) {
        equipped[category] = itemId;
      }
    }

    return {
      balance,
      totalEarned,
      totalSpent,
      claimed: readStringArray(data.claimed),
      purchased,
      equipped,
    };
  } catch {
    return emptyRewards();
  }
}

function saveRewards(state: RewardsState): boolean {
  try {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(REWARDS_EVENT));
    return true;
  } catch {
    return false;
  }
}

function readTasks(): StoredTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is StoredTask => {
      if (!value || typeof value !== "object") {
        return false;
      }

      const task = value as Partial<StoredTask>;

      return (
        typeof task.id === "string" &&
        typeof task.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(task.date) &&
        typeof task.completed === "boolean"
      );
    });
  } catch {
    return [];
  }
}

function addReward(
  state: RewardsState,
  key: string,
  amount: number
): void {
  if (state.claimed.includes(key)) return;

  state.claimed.push(key);
  state.balance += amount;
  state.totalEarned += amount;
}

function claimStudyRewards(
  state: RewardsState,
  history: StudyHistory
): void {
  for (const day of history.days) {
    // Session rewards are claimed by cumulative session count.
    // This also supports sessions completed before Part 8.
    const count = Math.max(0, Math.floor(day.sessions));

    for (let index = 1; index <= count; index++) {
      addReward(
        state,
        `session:${day.date}:${index}`,
        REWARD_RATES.session
      );
    }

    // The daily goal bonus can only be earned once per date.
    if (day.minutes >= history.dailyGoal) {
      addReward(
        state,
        `goal:${day.date}`,
        REWARD_RATES.dailyGoal
      );
    }
  }

  // The current streak can unlock the 7-day milestone.
  const streak = calculateStreak(history.days);

  if (streak >= 7) {
    addReward(
      state,
      "streak:7",
      REWARD_RATES.sevenDayStreak
    );
  }
}

function claimTaskRewards(state: RewardsState): void {
  for (const task of readTasks()) {
    if (!task.completed) continue;

    addReward(
      state,
      `task:${task.id}`,
      REWARD_RATES.task
    );
  }
}

/**
 * Synchronize earned stars with existing FocusFlow data.
 *
 * Call this when opening the shop or when study/task
 * progress changes. Already-claimed rewards are skipped.
 */
export function syncRewards(): RewardsState {
  if (typeof window === "undefined") {
    return emptyRewards();
  }

  const current = getRewards();

  const next: RewardsState = {
    ...current,
    claimed: [...current.claimed],
    purchased: [...current.purchased],
    equipped: { ...current.equipped },
  };

  claimStudyRewards(next, getStudyHistory());
  claimTaskRewards(next);

  if (next.claimed.length !== current.claimed.length) {
    if (!saveRewards(next)) return current;
  }

  return next;
}

export function purchaseItem(itemId: string): PurchaseResult {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);

  if (!item) {
    return { success: false, message: "Item not found." };
  }

  const state = syncRewards();

  if (state.purchased.includes(itemId)) {
    return {
      success: false,
      message: "You already own this item!",
    };
  }

  if (state.balance < item.price) {
    return {
      success: false,
      message: `You need ${item.price - state.balance} more stars.`,
    };
  }

  const next: RewardsState = {
    ...state,
    balance: state.balance - item.price,
    totalSpent: state.totalSpent + item.price,
    purchased: [...state.purchased, itemId],
  };

  if (!saveRewards(next)) {
    return {
      success: false,
      message: "Could not save your purchase.",
    };
  }

  return {
    success: true,
    message: `You unlocked ${item.name}! ✨`,
  };
}

export function equipItem(itemId: string): PurchaseResult {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);

  if (!item) {
    return { success: false, message: "Item not found." };
  }

  const state = getRewards();

  if (!state.purchased.includes(itemId)) {
    return {
      success: false,
      message: "Unlock this item first.",
    };
  }

  const next: RewardsState = {
    ...state,
    equipped: {
      ...state.equipped,
      [item.category]: itemId,
    },
  };

  if (!saveRewards(next)) {
    return {
      success: false,
      message: "Could not save your selection.",
    };
  }

  return {
    success: true,
    message: `${item.name} equipped! 💜`,
  };
}

export function unequipCategory(
  category: ShopCategory
): PurchaseResult {
  const state = getRewards();

  const next: RewardsState = {
    ...state,
    equipped: {
      ...state.equipped,
      [category]: null,
    },
  };

  if (!saveRewards(next)) {
    return {
      success: false,
      message: "Could not save your selection.",
    };
  }

  return {
    success: true,
    message: "Accessory removed.",
  };
}

export function subscribeToRewards(
  callback: () => void
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === REWARDS_KEY ||
      event.key === TASKS_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(REWARDS_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(REWARDS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
