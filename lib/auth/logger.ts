type AuthLogLevel = "info" | "warn" | "error";

type AuthLogPayload = Record<string, unknown>;

function formatAuthLog(
  action: string,
  level: AuthLogLevel,
  message: string,
  payload?: AuthLogPayload
): string {
  const entry = {
    scope: "auth",
    action,
    level,
    message,
    ...payload,
    ts: new Date().toISOString(),
  };

  return JSON.stringify(entry);
}

export function authLog(
  action: string,
  message: string,
  payload?: AuthLogPayload
): void {
  console.info(formatAuthLog(action, "info", message, payload));
}

export function authWarn(
  action: string,
  message: string,
  payload?: AuthLogPayload
): void {
  console.warn(formatAuthLog(action, "warn", message, payload));
}

export function authError(
  action: string,
  message: string,
  payload?: AuthLogPayload
): void {
  console.error(formatAuthLog(action, "error", message, payload));
}
