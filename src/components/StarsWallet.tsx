
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { Star, Sparkles, ShoppingBag } from "lucide-react";

import {
  getRewards,
  syncRewards,
  subscribeToRewards,
} from "../lib/rewards";

import {
  subscribeToStudyHistory,
} from "../lib/studyStats";

import "./StarsWallet.css";

export default function StarsWallet() {
  const reducedMotion = useReducedMotion();

  const [balance, setBalance] = useState(
    () => getRewards().balance
  );

  useEffect(() => {
    const refresh = () => {
      const rewards = syncRewards();
      setBalance(rewards.balance);
    };

    refresh();

    const unsubscribeRewards = subscribeToRewards(refresh);
    const unsubscribeStudy = subscribeToStudyHistory(refresh);

    window.addEventListener("focus", refresh);

    return () => {
      unsubscribeRewards();
      unsubscribeStudy();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <Link
      to="/rewards"
      className="stars-wallet"
      aria-label={`${balance} available stars. Open rewards shop.`}
    >
      <div className="stars-wallet-icon">
        <Star size={22} fill="currentColor" />
      </div>

      <div className="stars-wallet-content">
        <span>MY MAGICAL STARS</span>

        <motion.strong
          key={balance}
          initial={
            reducedMotion
              ? false
              : { scale: 1.2, opacity: 0.5 }
          }
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {balance.toLocaleString()}
        </motion.strong>

        <small>Earn stars. Unlock magic.</small>
      </div>

      <div className="stars-wallet-action">
        <ShoppingBag size={17} />
        <Sparkles size={12} />
      </div>
    </Link>
  );
}
