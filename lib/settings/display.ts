export const settingsInputClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10";

export const settingsSelectClassName =
  "w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3 pr-10 text-sm text-zinc-100 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60";

export const settingsSelectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
} as const;

export const settingsSliderClassName =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-violet-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30";

export const settingsLabelClassName =
  "mb-2 block text-sm font-medium text-zinc-300";

export function getSettingsFullName(
  email?: string | null,
  metadata?: Record<string, unknown> | null
): string {
  const fullName = metadata?.full_name ?? metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    const local = email.split("@")[0];
    if (local) {
      return local
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
  return "";
}

export function getAvatarInitials(name: string, email?: string | null): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0][0] ?? "";
      const last = parts[parts.length - 1][0] ?? "";
      const initials = `${first}${last}`.toUpperCase();
      return initials || "U";
    }
    const letter = parts[0]?.[0];
    return letter ? letter.toUpperCase() : "U";
  }

  if (email) {
    const letter = email.trim()[0];
    return letter ? letter.toUpperCase() : "U";
  }

  return "U";
}

export function getAvatarDisplayName(
  name: string,
  email?: string | null
): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? trimmed;
  }

  if (email) {
    const local = email.split("@")[0];
    if (local) {
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
  }

  return "";
}
