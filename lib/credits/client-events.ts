import { CREDIT_PACK_OPTIONS, type CreditPackOption } from "./purchase";

/** Dispatched when an AI action fails due to insufficient credits. */
export const NO_CREDITS_EVENT = "advora:no-credits";

export function dispatchNoCreditsEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NO_CREDITS_EVENT));
}

export function resolveCreditPack(credits: number): CreditPackOption | null {
  return CREDIT_PACK_OPTIONS.find((pack) => pack.credits === credits) ?? null;
}
