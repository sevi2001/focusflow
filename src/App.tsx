
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Route, Routes, useLocation } from "react-router-dom";

import RewardsShop from "./components/RewardsShop";
import PageLoader from "./components/PageLoader";
import StarRewardToast from "./components/StarRewardToast";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));

const StudyRoom = lazy(
  () => import("./components/StudyRoom")
);

const StudyDashboard = lazy(
  () => import("./components/StudyDashboard")
);

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* Animated page transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -10,
          }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
          className="min-h-screen"
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              {/* Home Page */}
              <Route
                path="/"
                element={<Home />}
              />

              {/* Study Room */}
              <Route
                path="/study-room"
                element={<StudyRoom />}
              />

              {/* Study Dashboard */}
              <Route
                path="/dashboard"
                element={<StudyDashboard />}
              />

              {/* Magical Rewards Shop */}
              <Route
                path="/rewards"
                element={<RewardsShop />}
              />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Global reward notifications */}
      {/* Must stay OUTSIDE <Routes> */}
      <StarRewardToast />
    </>
  );
}
