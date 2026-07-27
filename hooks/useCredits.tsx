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
import { ApiClientError, fetchCredits } from "@/lib/api/credits-client";
import type { CreditsApiResponse } from "@/lib/credits/types";
import { supabase } from "@/lib/supabase";

type CreditsContextValue = {
  credits: CreditsApiResponse | null;
  isLoading: boolean;
  error: string | null;
  /** Always fetches the latest balance from GET /api/credits. */
  refresh: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

let cachedCredits: CreditsApiResponse | null = null;

async function handleCreditsAuthFailure(error: ApiClientError) {
  if (error.status === 403 && error.code === "EMAIL_NOT_VERIFIED") {
    window.location.assign("/verify-email");
    return;
  }

  if (error.status !== 401) {
    return;
  }

  cachedCredits = null;
  await supabase.auth.signOut();
  window.location.assign("/login");
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<CreditsApiResponse | null>(cachedCredits);
  const [isLoading, setIsLoading] = useState(!cachedCredits);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
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
        setCredits(data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          await handleCreditsAuthFailure(err);
        }

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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefreshCredits = () => void refresh();
    window.addEventListener("advora:refresh-credits", onRefreshCredits);
    return () =>
      window.removeEventListener("advora:refresh-credits", onRefreshCredits);
  }, [refresh]);

  const value = useMemo(
    () => ({
      credits,
      isLoading,
      error,
      refresh,
    }),
    [credits, isLoading, error, refresh]
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
}
