type CreditsLogLevel = "info" | "warn" | "error";

function formatCreditsLog(
  action: string,
  level: CreditsLogLevel,
  message: string,
  payload?: Record<string, unknown>
): string {
  return JSON.stringify({
    scope: "credits",
    action,
    level,
    message,
    ...payload,
    ts: new Date().toISOString(),
  });
}

export function creditsLog(
  action: string,
  message: string,
  payload?: Record<string, unknown>
): void {
  console.info(formatCreditsLog(action, "info", message, payload));
}

export function creditsWarn(
  action: string,
  message: string,
  payload?: Record<string, unknown>
): void {
  console.warn(formatCreditsLog(action, "warn", message, payload));
}

export function creditsError(
  action: string,
  message: string,
  payload?: Record<string, unknown>
): void {
  console.error(formatCreditsLog(action, "error", message, payload));
}
