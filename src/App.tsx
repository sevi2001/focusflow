
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Route, Routes, useLocation } from "react-router-dom";

import PageLoader from "./components/PageLoader";

const Home = lazy(() => import("./pages/Home"));
const StudyRoom = lazy(() => import("./components/StudyRoom"));
const StudyDashboard = lazy(
  () => import("./components/StudyDashboard")
);

export default function App() {
  const location = useLocation();

  return (
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
            <Route path="/" element={<Home />} />
            <Route
              path="/study-room"
              element={<StudyRoom />}
            />
            <Route
              path="/dashboard"
              element={<StudyDashboard />}
            />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
