import type { SelectHTMLAttributes } from "react";
import {
  settingsLabelClassName,
  settingsSelectClassName,
  settingsSelectStyle,
} from "@/lib/settings/display";

type SettingsSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

export default function SettingsSelect({
  label,
  hint,
  id,
  children,
  className,
  ...props
}: SettingsSelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label htmlFor={selectId} className={settingsLabelClassName}>
        {label}
      </label>
      <select
        id={selectId}
        className={`${settingsSelectClassName}${className ? ` ${className}` : ""}`}
        style={settingsSelectStyle}
        {...props}
      >
        {children}
      </select>
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
