import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "@/pages/Home";
import { Sidebar } from "@/components/Sidebar";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <Routes>
            <Route path="/" element={<Home onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />} />
            <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
