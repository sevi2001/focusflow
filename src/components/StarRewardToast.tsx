
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star, X } from "lucide-react";

import {
  getRewards,
  syncRewards,
  subscribeToRewards,
} from "../lib/rewards";

import {
  subscribeToStudyHistory,
} from "../lib/studyStats";

import "./StarRewardToast.css";

type RewardNotice = {
  id: number;
  amount: number;
};

export default function StarRewardToast() {
  const [notice, setNotice] = useState<RewardNotice | null>(
    null
  );

  const lastEarned = useRef(getRewards().totalEarned);
  const initialized = useRef(false);
  const noticeId = useRef(0);

  useEffect(() => {
    const refresh = () => {
      const rewards = syncRewards();

      if (!initialized.current) {
        lastEarned.current = rewards.totalEarned;
        initialized.current = true;
        return;
      }

      const earned = rewards.totalEarned - lastEarned.current;
      lastEarned.current = rewards.totalEarned;

      if (earned > 0) {
        noticeId.current += 1;

        setNotice({
          id: noticeId.current,
          amount: earned,
        });
      }
    };

    refresh();

    const unsubscribeRewards = subscribeToRewards(refresh);
    const unsubscribeStudy = subscribeToStudyHistory(refresh);

    return () => {
      unsubscribeRewards();
      unsubscribeStudy();
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          key={notice.id}
          className="star-reward-toast"
          role="status"
          initial={{ opacity: 0, y: 35, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 20,
          }}
        >
          <motion.div
            className="star-reward-toast-icon"
            animate={{ rotate: [0, -12, 12, 0] }}
            transition={{ duration: 0.6 }}
          >
            <Star size={27} fill="currentColor" />
          </motion.div>

          <div className="star-reward-toast-copy">
            <strong>Magical Stars Earned!</strong>
            <span>+{notice.amount} ⭐ Keep going!</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss star reward"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
