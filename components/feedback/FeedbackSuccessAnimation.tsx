"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function FeedbackSuccessAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-violet-500/10 to-cyan-400/10 px-6 py-12 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.05 }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-xl shadow-violet-500/30"
      >
        <Heart className="h-10 w-10 fill-white text-white" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-semibold tracking-tight text-white"
      >
        Thank you for helping improve Advora AI ❤️
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400"
      >
        Your feedback was submitted successfully. The Advora team reviews every
        submission.
      </motion.p>
    </motion.div>
  );
}
