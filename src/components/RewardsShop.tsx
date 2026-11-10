
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Gift,
  Heart,
  LockKeyhole,
  PawPrint,
  ShoppingBag,
  Sparkles,
  Star,
  WandSparkles,
  X,
} from "lucide-react";

import {
  SHOP_ITEMS,
  REWARD_RATES,
  getRewards,
  syncRewards,
  purchaseItem,
  equipItem,
  unequipCategory,
  subscribeToRewards,
  type RewardsState,
  type ShopCategory,
  type ShopItem,
} from "../lib/rewards";

import {
  subscribeToStudyHistory,
} from "../lib/studyStats";

import "./RewardsShop.css";

type Category = "all" | ShopCategory;

const categories: {
  id: Category;
  name: string;
  emoji: string;
}[] = [
  { id: "all", name: "All Treasures", emoji: "✨" },
  { id: "pet", name: "Pet Accessories", emoji: "🐾" },
  { id: "girl", name: "Girl Dress-Up", emoji: "🎀" },
  { id: "room", name: "Dream Room", emoji: "🌙" },
];

const categoryNames: Record<ShopCategory, string> = {
  pet: "Pet Accessory",
  girl: "Girl Outfit",
  room: "Room Decoration",
};

const categoryColors: Record<ShopCategory, string> = {
  pet: "#f9a8d4",
  girl: "#c4b5fd",
  room: "#fcd68c",
};

function getInitialRewards(): RewardsState {
  return getRewards();
}

function ShopCard({
  item,
  owned,
  equipped,
  affordable,
  onBuy,
  onEquip,
  onUnequip,
  index,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: (category: ShopCategory) => void;
  index: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      layout
      initial={
        reducedMotion
          ? false
          : { opacity: 0, y: 25, scale: 0.94 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.25),
      }}
      whileHover={
        reducedMotion ? undefined : { y: -7 }
      }
      className={`rewards-item rewards-item--${item.category}`}
      style={
        {
          "--item-accent": categoryColors[item.category],
        } as React.CSSProperties
      }
    >
      <div className="rewards-item-top">
        <span className="rewards-item-category">
          {categoryNames[item.category]}
        </span>

        {equipped ? (
          <span className="rewards-status rewards-status--equipped">
            <Check size={13} />
            Equipped
          </span>
        ) : owned ? (
          <span className="rewards-status rewards-status--owned">
            <CheckCircle2 size={13} />
            Owned
          </span>
        ) : (
          <span className="rewards-status rewards-status--locked">
            <LockKeyhole size={13} />
            Locked
          </span>
        )}
      </div>

      <div className="rewards-item-art">
        <span className="rewards-item-orbit orbit-one">✦</span>
        <span className="rewards-item-orbit orbit-two">✧</span>
        <span className="rewards-item-orbit orbit-three">✦</span>

        <motion.div
          className="rewards-item-emoji"
          animate={
            reducedMotion
              ? undefined
              : {
                  y: [0, -9, 0],
                  rotate: [-4, 4, -4],
                }
          }
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
          aria-hidden="true"
        >
          {item.emoji}
        </motion.div>
      </div>

      <div className="rewards-item-info">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>

      <div className="rewards-item-bottom">
        <span className="rewards-price">
          <Star size={17} fill="currentColor" />
          {item.price}
        </span>

        {equipped ? (
          <button
            type="button"
            className="rewards-item-button rewards-item-button--secondary"
            onClick={() => onUnequip(item.category)}
          >
            <X size={15} />
            Unequip
          </button>
        ) : owned ? (
          <button
            type="button"
            className="rewards-item-button rewards-item-button--equip"
            onClick={() => onEquip(item.id)}
          >
            <WandSparkles size={16} />
            Equip
          </button>
        ) : (
          <button
            type="button"
            className="rewards-item-button rewards-item-button--buy"
            disabled={!affordable}
            onClick={() => onBuy(item.id)}
            title={
              affordable
                ? `Unlock ${item.name}`
                : "Not enough stars"
            }
          >
            {affordable ? (
              <ShoppingBag size={16} />
            ) : (
              <LockKeyhole size={16} />
            )}
            {affordable ? "Unlock" : "Need Stars"}
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function RewardsShop() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [rewards, setRewards] = useState<RewardsState>(
    getInitialRewards
  );

  const [category, setCategory] = useState<Category>("all");

  const [notification, setNotification] = useState<{
    id: number;
    message: string;
    success: boolean;
  } | null>(null);

  const [celebration, setCelebration] = useState<{
    id: number;
    name: string;
    emoji: string;
  } | null>(null);

  const refreshRewards = useCallback(() => {
    setRewards(syncRewards());
  }, []);

  useEffect(() => {
    refreshRewards();

    const unsubscribeRewards = subscribeToRewards(
      refreshRewards
    );

    const unsubscribeStudy = subscribeToStudyHistory(
      refreshRewards
    );

    const handleFocus = () => refreshRewards();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshRewards();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      unsubscribeRewards();
      unsubscribeStudy();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [refreshRewards]);

  const filteredItems = useMemo(
    () =>
      category === "all"
        ? SHOP_ITEMS
        : SHOP_ITEMS.filter(
            (item) => item.category === category
          ),
    [category]
  );

  const ownedCount = rewards.purchased.length;

  const showMessage = (
    message: string,
    success: boolean
  ) => {
    setNotification({
      id: Date.now(),
      message,
      success,
    });
  };

  const handleBuy = (itemId: string) => {
    const result = purchaseItem(itemId);

    setRewards(getRewards());
    showMessage(result.message, result.success);

    if (result.success) {
      const item = SHOP_ITEMS.find(
        (entry) => entry.id === itemId
      );

      if (item) {
        setCelebration({
          id: Date.now(),
          name: item.name,
          emoji: item.emoji,
        });
      }
    }
  };

  const handleEquip = (itemId: string) => {
    const result = equipItem(itemId);

    setRewards(getRewards());
    showMessage(result.message, result.success);
  };

  const handleUnequip = (itemCategory: ShopCategory) => {
    const result = unequipCategory(itemCategory);

    setRewards(getRewards());
    showMessage(result.message, result.success);
  };

  return (
    <div className="rewards-page">
      <div className="rewards-background" aria-hidden="true">
        <span className="rewards-bg-star star-one">✦</span>
        <span className="rewards-bg-star star-two">✧</span>
        <span className="rewards-bg-star star-three">✦</span>
        <span className="rewards-bg-star star-four">✧</span>
        <span className="rewards-bg-star star-five">✦</span>
      </div>

      <header className="rewards-header">
        <div className="rewards-header-inner">
          <button
            type="button"
            className="rewards-back"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={18} />
            Dashboard
          </button>

          <div className="rewards-brand">
            <span className="rewards-brand-icon">
              <Sparkles size={21} />
            </span>
            <span>FocusFlow</span>
          </div>

          <div className="rewards-wallet-small">
            <Star size={17} fill="currentColor" />
            <strong>{rewards.balance}</strong>
            <span>Stars</span>
          </div>
        </div>
      </header>

      <main className="rewards-main">
        <motion.section
          className="rewards-hero"
          initial={
            reducedMotion ? false : { opacity: 0, y: 25 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rewards-hero-copy">
            <span className="rewards-eyebrow">
              <Sparkles size={15} />
              YOUR MAGICAL LITTLE WORLD
            </span>

            <h1>
              Magical <span>Rewards Shop</span>
            </h1>

            <p>
              Every study session brings a little more magic.
              Collect stars, unlock adorable treasures, and
              make your cozy world uniquely yours.
            </p>

            <div className="rewards-hero-tags">
              <span>🐾 Pet Accessories</span>
              <span>🎀 Cute Outfits</span>
              <span>🌙 Dream Room</span>
            </div>
          </div>

          <div className="rewards-hero-art" aria-hidden="true">
            <div className="rewards-magic-circle" />

            <motion.span
              className="rewards-hero-gift"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, -15, 0],
                      rotate: [-6, 6, -6],
                    }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🎁
            </motion.span>

            <span className="rewards-hero-float float-a">⭐</span>
            <span className="rewards-hero-float float-b">🎀</span>
            <span className="rewards-hero-float float-c">💜</span>
            <span className="rewards-hero-float float-d">✨</span>
          </div>
        </motion.section>

        <section className="rewards-summary">
          <motion.div
            className="rewards-summary-card rewards-summary-card--wallet"
            whileHover={
              reducedMotion ? undefined : { y: -4 }
            }
          >
            <div className="rewards-summary-icon">⭐</div>
            <div>
              <span>Available Stars</span>
              <strong>{rewards.balance.toLocaleString()}</strong>
              <small>Spend them on magical treasures</small>
            </div>
          </motion.div>

          <motion.div
            className="rewards-summary-card"
            whileHover={
              reducedMotion ? undefined : { y: -4 }
            }
          >
            <div className="rewards-summary-icon">✨</div>
            <div>
              <span>Total Earned</span>
              <strong>
                {rewards.totalEarned.toLocaleString()}
              </strong>
              <small>Stars from your progress</small>
            </div>
          </motion.div>

          <motion.div
            className="rewards-summary-card"
            whileHover={
              reducedMotion ? undefined : { y: -4 }
            }
          >
            <div className="rewards-summary-icon">🎁</div>
            <div>
              <span>Unlocked Treasures</span>
              <strong>
                {ownedCount}
                <em> / {SHOP_ITEMS.length}</em>
              </strong>
              <small>Your growing collection</small>
            </div>
          </motion.div>
        </section>

        <section className="rewards-earn-section">
          <div className="rewards-section-heading">
            <div>
              <span className="rewards-eyebrow">
                LITTLE STEPS, BIG MAGIC
              </span>
              <h2>
                How to earn stars <Sparkles size={19} />
              </h2>
            </div>

            <button
              type="button"
              className="rewards-study-button"
              onClick={() => navigate("/study-room")}
            >
              Start Studying
              <ArrowLeft size={16} className="rewards-arrow-right" />
            </button>
          </div>

          <div className="rewards-earn-grid">
            <div className="rewards-earn-item">
              <span>⏳</span>
              <div>
                <strong>Focus Session</strong>
                <small>Complete a Pomodoro</small>
              </div>
              <b>+{REWARD_RATES.session} ⭐</b>
            </div>

            <div className="rewards-earn-item">
              <span>✅</span>
              <div>
                <strong>Daily Task</strong>
                <small>Finish a task</small>
              </div>
              <b>+{REWARD_RATES.task} ⭐</b>
            </div>

            <div className="rewards-earn-item">
              <span>🎯</span>
              <div>
                <strong>Daily Goal</strong>
                <small>Reach your focus target</small>
              </div>
              <b>+{REWARD_RATES.dailyGoal} ⭐</b>
            </div>

            <div className="rewards-earn-item">
              <span>🔥</span>
              <div>
                <strong>7-Day Streak</strong>
                <small>Keep your study streak</small>
              </div>
              <b>+{REWARD_RATES.sevenDayStreak} ⭐</b>
            </div>
          </div>
        </section>

        <section className="rewards-shop-section">
          <div className="rewards-section-heading">
            <div>
              <span className="rewards-eyebrow">
                MADE FOR YOUR COZY WORLD
              </span>
              <h2>
                Explore Treasures <Gift size={21} />
              </h2>
              <p>
                Unlock your favorites and equip them whenever
                you like.
              </p>
            </div>

            <div className="rewards-owned-label">
              <Heart size={16} />
              {ownedCount} collected
            </div>
          </div>

          <div
            className="rewards-tabs"
            role="group"
            aria-label="Shop categories"
          >
            {categories.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`rewards-tab ${
                  category === entry.id ? "is-active" : ""
                }`}
                aria-pressed={category === entry.id}
                onClick={() => setCategory(entry.id)}
              >
                <span>{entry.emoji}</span>
                {entry.name}
              </button>
            ))}
          </div>

          <motion.div layout className="rewards-items-grid">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  index={index}
                  owned={rewards.purchased.includes(item.id)}
                  equipped={
                    rewards.equipped[item.category] === item.id
                  }
                  affordable={rewards.balance >= item.price}
                  onBuy={handleBuy}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <div className="rewards-footer">
          <PawPrint size={17} />
          A little progress every day creates a magical journey.
          <Sparkles size={17} />
        </div>
      </main>

      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            role="status"
            className={`rewards-toast ${
              notification.success
                ? "rewards-toast--success"
                : "rewards-toast--error"
            }`}
            initial={{ opacity: 0, y: 35, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <span>{notification.success ? "✨" : "💜"}</span>
            <p>{notification.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification(null)}
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebration && (
          <motion.div
            key={celebration.id}
            className="rewards-celebration-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rewards-celebration-card"
              initial={{ scale: 0.65, y: 35 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 18,
              }}
            >
              <button
                type="button"
                className="rewards-celebration-close"
                aria-label="Close celebration"
                onClick={() => setCelebration(null)}
              >
                <X size={19} />
              </button>

              <div className="rewards-celebration-stars">
                ✦ ✨ ✦
              </div>

              <motion.div
                className="rewards-celebration-emoji"
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        rotate: [-8, 8, -8],
                        scale: [1, 1.12, 1],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                {celebration.emoji}
              </motion.div>

              <span className="rewards-celebration-eyebrow">
                MAGICAL UNLOCK
              </span>

              <h2>New Treasure!</h2>
              <p>
                You unlocked <strong>{celebration.name}</strong>!
              </p>

              <div className="rewards-celebration-sparkles">
                💜 ✨ 🌟 ✨ 💜
              </div>

              <button
                type="button"
                className="rewards-celebration-button"
                onClick={() => setCelebration(null)}
              >
                <Sparkles size={18} />
                Yay! Continue Shopping
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
