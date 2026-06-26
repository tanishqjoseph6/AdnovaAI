export const settingsInputClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10";

export const settingsSelectClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10";

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
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "AA";
}
