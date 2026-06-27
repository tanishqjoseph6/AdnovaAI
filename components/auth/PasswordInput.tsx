"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  id?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: "current-password" | "new-password";
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function PasswordInput({
  id,
  value,
  placeholder = "Password",
  disabled = false,
  className = "w-full rounded border p-3 pr-11",
  autoComplete = "current-password",
  onChange,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        autoComplete={autoComplete}
        className={className}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        ) : (
          <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}
