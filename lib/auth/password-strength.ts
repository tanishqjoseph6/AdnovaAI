export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  label: string;
  percent: number;
  colorClass: string;
};

export function scorePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      level: "empty",
      label: "",
      percent: 0,
      colorClass: "bg-zinc-600",
    };
  }

  let points = 0;

  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^a-zA-Z0-9]/.test(password)) points += 1;

  if (points <= 1) {
    return {
      level: "weak",
      label: "Weak",
      percent: 25,
      colorClass: "bg-red-500",
    };
  }

  if (points === 2) {
    return {
      level: "fair",
      label: "Fair",
      percent: 50,
      colorClass: "bg-amber-500",
    };
  }

  if (points === 3 || points === 4) {
    return {
      level: "good",
      label: "Good",
      percent: 75,
      colorClass: "bg-cyan-500",
    };
  }

  return {
    level: "strong",
    label: "Strong",
    percent: 100,
    colorClass: "bg-emerald-500",
  };
}
