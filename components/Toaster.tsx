"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../lib/toast";

export default function Toaster() {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: "success" | "error" | "info" }>>([]);

  useEffect(() => {
    return toast.subscribe((msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 4000);
    });
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`p-4 rounded-lg shadow-lg font-body text-sm flex items-center justify-between border ${
              msg.type === "success"
                ? "bg-[#1C1C1C] border-[#4ECDC4]/30 text-[#4ECDC4]"
                : msg.type === "error"
                ? "bg-[#1C1C1C] border-[#E91E8C]/30 text-[#E91E8C]"
                : "bg-[#1C1C1C] border-white/10 text-white"
            }`}
          >
            <span>{msg.text}</span>
            <button
              onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
              className="ml-4 text-xs font-bold text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
