"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeEmail } from "@/lib/auth/validation";

const STORAGE_PREFIX = "advora:password-reset-cooldown:";
export const PASSWORD_RESET_COOLDOWN_SECONDS = 60;

function readCooldownEnd(email: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${normalizeEmail(email)}`);
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeCooldownEnd(email: string, endsAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    `${STORAGE_PREFIX}${normalizeEmail(email)}`,
    String(endsAt)
  );
}

function secondsRemaining(endsAt: number): number {
  if (!endsAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function usePasswordResetCooldown(email: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const endsAt = readCooldownEnd(email);
    setSecondsLeft(secondsRemaining(endsAt));

    if (secondsRemaining(endsAt) <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      const remaining = secondsRemaining(readCooldownEnd(email));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [email]);

  const startCooldown = useCallback(() => {
    const endsAt = Date.now() + PASSWORD_RESET_COOLDOWN_SECONDS * 1000;
    writeCooldownEnd(email, endsAt);
    setSecondsLeft(PASSWORD_RESET_COOLDOWN_SECONDS);
  }, [email]);

  const isOnCooldown = secondsLeft > 0;

  return { secondsLeft, isOnCooldown, startCooldown };
}
