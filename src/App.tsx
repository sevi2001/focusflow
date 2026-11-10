
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import StudyRoom from "./components/StudyRoom";
import StudyDashboard from "./components/StudyDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/study-room" element={<StudyRoom />} />
      <Route path="/dashboard" element={<StudyDashboard />} />
    </Routes>
  );
}
