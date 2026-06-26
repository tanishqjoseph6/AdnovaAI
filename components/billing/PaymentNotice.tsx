"use client";

import { motion } from "framer-motion";

type PaymentNoticeProps = {
  payment?: string;
  message?: string;
};

export default function PaymentNotice({ payment, message }: PaymentNoticeProps) {
  if (!payment) {
    return null;
  }

  if (payment === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
      >
        Payment successful. Your subscription is now active.
      </motion.div>
    );
  }

  const text =
    message ??
    (payment === "cancelled"
      ? "Payment was cancelled. You can try again anytime."
      : "Payment failed. Please try again.");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {text}
    </motion.div>
  );
}
