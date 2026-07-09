"use client";

import { useEffect, useState } from "react";
import UpgradeModal from "@/components/credits/UpgradeModal";
import { NO_CREDITS_EVENT } from "@/lib/credits/client-events";

/** Global host for the Buy More Credits modal. */
export default function NoCreditsModalHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onNoCredits = () => setOpen(true);
    window.addEventListener(NO_CREDITS_EVENT, onNoCredits);
    return () => window.removeEventListener(NO_CREDITS_EVENT, onNoCredits);
  }, []);

  return <UpgradeModal open={open} onClose={() => setOpen(false)} />;
}
