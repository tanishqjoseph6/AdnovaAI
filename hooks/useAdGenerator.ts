"use client";

import { useCallback, useReducer } from "react";
import { fetchGeneratedAds } from "@/lib/api/generate-ads-client";
import type { GenerateAdsResponse } from "@/lib/validations/generate-ads";

export type AdGeneratorState =
  | { status: "idle" }
  | { status: "loading"; data?: GenerateAdsResponse }
  | { status: "success"; data: GenerateAdsResponse }
  | { status: "error"; message: string };

type Action =
  | { type: "START" }
  | { type: "SUCCESS"; data: GenerateAdsResponse }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

function reducer(state: AdGeneratorState, action: Action): AdGeneratorState {
  switch (action.type) {
    case "START":
      return state.status === "success"
        ? { status: "loading", data: state.data }
        : { status: "loading" };
    case "SUCCESS":
      return { status: "success", data: action.data };
    case "ERROR":
      return { status: "error", message: action.message };
    case "CLEAR_ERROR":
      return state.status === "error" ? { status: "idle" } : state;
    case "RESET":
      return { status: "idle" };
    default:
      return { status: "idle" };
  }
}

export function useAdGenerator() {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });

  const generate = useCallback(async (productDescription: string) => {
    dispatch({ type: "START" });

    try {
      const data = await fetchGeneratedAds(productDescription);
      dispatch({ type: "SUCCESS", data });
      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate ads. Please try again.";
      dispatch({ type: "ERROR", message });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const isLoading = state.status === "loading";
  const hasOutput = state.status === "loading" || state.status === "success";

  const outputData =
    state.status === "success"
      ? state.data
      : state.status === "loading" && state.data
        ? state.data
        : null;

  return {
    state,
    generate,
    clearError,
    reset,
    isLoading,
    hasOutput,
    outputData,
  };
}
