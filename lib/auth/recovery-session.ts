import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isRecoveryHash,
  parseAuthHash,
  type RecoveryHashParams,
} from "@/lib/auth/recovery";

const RECOVERY_WAIT_MS = 10_000;

export type RecoverySessionResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "pending" };

function stripAuthHashFromUrl(): void {
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

async function setSessionFromHash(
  supabase: SupabaseClient,
  hashParams: RecoveryHashParams
): Promise<boolean> {
  if (!hashParams.access_token) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: hashParams.access_token,
    refresh_token: hashParams.refresh_token ?? "",
  });

  if (error) {
    console.warn("[recovery] setSession from hash failed:", error.message);
    return false;
  }

  stripAuthHashFromUrl();
  return true;
}

async function hasAuthenticatedUser(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return true;
  }

  const { data: userData, error } = await supabase.auth.getUser();
  return !error && Boolean(userData.user);
}

function waitForRecoverySession(
  supabase: SupabaseClient
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (valid: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
      resolve(valid);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.user &&
        (event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED")
      ) {
        finish(true);
      }
    });

    const timeout = window.setTimeout(() => finish(false), RECOVERY_WAIT_MS);
  });
}

/**
 * Establishes a Supabase recovery session from URL hash tokens or existing cookies.
 */
export async function establishRecoverySession(
  supabase: SupabaseClient
): Promise<RecoverySessionResult> {
  const hashParams = parseAuthHash(window.location.hash);

  if (isRecoveryHash(hashParams)) {
    const established = await setSessionFromHash(supabase, hashParams);
    if (established) {
      return { ok: true };
    }
    return { ok: false, reason: "expired" };
  }

  if (await hasAuthenticatedUser(supabase)) {
    return { ok: true };
  }

  const recovered = await waitForRecoverySession(supabase);
  if (recovered) {
    return { ok: true };
  }

  if (await hasAuthenticatedUser(supabase)) {
    return { ok: true };
  }

  return { ok: false, reason: "expired" };
}

export function getRecoveryRedirectTarget(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hashParams = parseAuthHash(window.location.hash);
  if (isRecoveryHash(hashParams)) {
    const { pathname, search, hash } = window.location;
    if (pathname === "/reset-password") {
      return null;
    }
    return `/reset-password${search}${hash}`;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (tokenHash && type === "recovery" && window.location.pathname !== "/auth/callback") {
    return `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=${encodeURIComponent("/reset-password")}`;
  }

  if (code && window.location.pathname !== "/auth/callback") {
    const next =
      params.get("next") ??
      (type === "recovery" ? "/reset-password" : "/dashboard");
    return `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
  }

  return null;
}
