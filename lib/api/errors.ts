import {
  GoogleGenerativeAIError,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { ZodError } from "zod";
import { ConfigurationError } from "@/lib/errors";

function isGeminiError(error: unknown): error is GoogleGenerativeAIError {
  return error instanceof GoogleGenerativeAIError;
}

function isGeminiFetchError(
  error: unknown
): error is GoogleGenerativeAIFetchError {
  return error instanceof GoogleGenerativeAIFetchError;
}

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export function toErrorResponse(error: unknown): {
  status: number;
  body: ApiErrorBody;
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: "Invalid request body",
        details: error.flatten().fieldErrors,
      },
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      status: 503,
      body: { error: "AI service is not configured" },
    };
  }

  if (isGeminiFetchError(error)) {
    if (error.status === 401 || error.status === 403) {
      return {
        status: 503,
        body: { error: "AI service authentication failed. Check your API key." },
      };
    }
    if (error.status === 429) {
      return {
        status: 429,
        body: {
          error: "Gemini rate limit exceeded. Please wait a moment and try again.",
        },
      };
    }
    if (error.status === 404) {
      return {
        status: 503,
        body: {
          error:
            "Model not available. Set GEMINI_MODEL to a supported Gemini model.",
        },
      };
    }
    return {
      status: 502,
      body: {
        error:
          process.env.NODE_ENV === "development"
            ? `AI service error: ${error.message}`
            : "AI service request failed",
      },
    };
  }

  if (isGeminiError(error)) {
    return {
      status: 502,
      body: {
        error:
          process.env.NODE_ENV === "development"
            ? `AI service error: ${error.message}`
            : "AI service request failed",
      },
    };
  }

  if (error instanceof Error) {
    const isClientSafe =
      error.message.includes("refusal") ||
      error.message.includes("unparseable");

    return {
      status: 500,
      body: {
        error:
          process.env.NODE_ENV === "development" || isClientSafe
            ? error.message
            : "Failed to generate ads",
      },
    };
  }

  return { status: 500, body: { error: "Internal server error" } };
}
