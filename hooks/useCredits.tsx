"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CreditsApiResponse } from "@/lib/credits/types";
import { fetchCredits } from "@/lib/api/credits-client";

type CreditsContextValue = {
  credits: CreditsApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  optimisticDecrement: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

let cachedCredits: CreditsApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<CreditsApiResponse | null>(cachedCredits);
  const [isLoading, setIsLoading] = useState(!cachedCredits);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async (force = false) => {
    if (
      !force &&
      cachedCredits &&
      Date.now() - cacheTimestamp < CACHE_TTL_MS
    ) {
      setCredits(cachedCredits);
      setIsLoading(false);
      return;
    }

    if (inflight.current) {
      await inflight.current;
      return;
    }

    const task = (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCredits();
        cachedCredits = data;
        cacheTimestamp = Date.now();
        setCredits(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load credits";
        setError(message);
      } finally {
        setIsLoading(false);
        inflight.current = null;
      }
    })();

    inflight.current = task;
    await task;
  }, []);

  const optimisticDecrement = useCallback(() => {
    setCredits((current) => {
      if (!current || current.unlimited) {
        return current;
      }

      const next = {
        ...current,
        credits: Math.max(0, current.credits - 1),
      };
      cachedCredits = next;
      cacheTimestamp = Date.now();
      return next;
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      credits,
      isLoading,
      error,
      refresh: () => refresh(true),
      optimisticDecrement,
    }),
    [credits, isLoading, error, refresh, optimisticDecrement]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within CreditsProvider");
  }
  return context;
}

export function invalidateCreditsCache() {
  cachedCredits = null;
  cacheTimestamp = 0;
}
