"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRecoveryRedirectTarget } from "@/lib/auth/recovery-session";

/**
 * Sends users with Supabase recovery tokens (hash or query) to the reset-password flow.
 */
export default function RecoveryRedirectHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const target = getRecoveryRedirectTarget();
    if (target && target.split("?")[0] !== pathname) {
      router.replace(target);
    }
  }, [pathname, router]);

  return null;
}
