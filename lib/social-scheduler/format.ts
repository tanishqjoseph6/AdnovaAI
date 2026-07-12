const SCHEDULER_LOCALE = "en-US";

const schedulerDateTimeFormatter = new Intl.DateTimeFormat(SCHEDULER_LOCALE, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const schedulerPreviewFormatter = new Intl.DateTimeFormat(SCHEDULER_LOCALE, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const schedulerMonthYearFormatter = new Intl.DateTimeFormat(SCHEDULER_LOCALE, {
  month: "long",
  year: "numeric",
});

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseIsoDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse YYYY-MM-DD + HH:mm as local wall-clock (client-only safe). */
export function parseLocalDateTimeParts(
  date: string,
  time: string
): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
}

/** Deterministic en-US formatting for stored ISO timestamps. */
export function formatSchedulerDateTime(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) {
    return iso;
  }

  return schedulerDateTimeFormatter.format(date);
}

/** Preview label from compose date/time fields — call only after hydration. */
export function formatSchedulerPreviewFromParts(
  date: string,
  time: string
): string {
  if (!date) {
    return "Select date and time";
  }

  const parsed = parseLocalDateTimeParts(date, time || "00:00");
  if (!parsed) {
    return "Select date and time";
  }

  return schedulerPreviewFormatter.format(parsed);
}

export function formatSchedulerMonthYear(date: Date): string {
  return schedulerMonthYearFormatter.format(date);
}

export function formatSchedulerDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatSchedulerTimeInput(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function isoToLocalDateInput(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) {
    return "";
  }

  return formatSchedulerDateInput(date);
}

export function isoToLocalTimeInput(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) {
    return "";
  }

  return formatSchedulerTimeInput(date);
}

export function localDateTimeToIso(date: string, time: string): string {
  const parsed = parseLocalDateTimeParts(date, time || "00:00");
  return parsed ? parsed.toISOString() : new Date().toISOString();
}

export function createDefaultComposeDateTime(): { date: string; time: string } {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);

  return {
    date: formatSchedulerDateInput(date),
    time: formatSchedulerTimeInput(date),
  };
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
