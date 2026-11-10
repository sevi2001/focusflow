
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import LittleLettersShortcut from "./components/LittleLettersShortcut";
import {
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import RewardsShop from "./components/RewardsShop";
import PageLoader from "./components/PageLoader";
import StarRewardToast from "./components/StarRewardToast";

const Home = lazy(() => import("./pages/Home"));

const StudyRoom = lazy(
  () => import("./components/StudyRoom")
);

const StudyDashboard = lazy(
  () => import("./components/StudyDashboard")
);

const LittleLetters = lazy(
  () => import("./pages/LittleLetters")
);

export default function App() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
          className="min-h-screen"
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/study-room"
                element={<StudyRoom />}
              />

              <Route
                path="/dashboard"
                element={<StudyDashboard />}
              />

              <Route
                path="/rewards"
                element={<RewardsShop />}
              />

              <Route
                path="/little-letters"
                element={<LittleLetters />}
              />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Keep outside Routes to avoid the blank-screen error */}
      <StarRewardToast />

      <StarRewardToast />

{location.pathname !== "/little-letters" && (
  <LittleLettersShortcut />
)}
    </>
  );
}
