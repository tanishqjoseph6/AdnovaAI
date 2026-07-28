"use client";

import {
  EMPTY_REEL_SCRIPT_INPUT,
  REEL_BRAND_VOICES,
  REEL_DURATIONS,
  REEL_GOAL_LABELS,
  REEL_GOALS,
  REEL_PLATFORM_LABELS,
  REEL_PLATFORMS,
  type ReelScriptInput,
} from "@/lib/reel-script/types";
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
  settingsSelectStyle,
} from "@/lib/settings/display";

type ReelScriptFormProps = {
  value: ReelScriptInput;
  isLoading: boolean;
  onChange: <K extends keyof ReelScriptInput>(
    key: K,
    next: ReelScriptInput[K]
  ) => void;
  onSubmit: () => void;
};

export default function ReelScriptForm({
  value,
  isLoading,
  onChange,
  onSubmit,
}: ReelScriptFormProps) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="reel-product-url" className={settingsLabelClassName}>
            Product URL
          </label>
          <input
            id="reel-product-url"
            type="url"
            inputMode="url"
            value={value.productUrl}
            disabled={isLoading}
            onChange={(event) => onChange("productUrl", event.target.value)}
            placeholder="https://yourproduct.com"
            className={settingsInputClassName}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="reel-product-description"
            className={settingsLabelClassName}
          >
            Product Description
          </label>
          <textarea
            id="reel-product-description"
            value={value.productDescription}
            disabled={isLoading}
            onChange={(event) =>
              onChange("productDescription", event.target.value)
            }
            placeholder="What does your product do, who is it for, and why should someone care?"
            rows={4}
            className={`${settingsInputClassName} min-h-28 resize-y`}
            required
          />
        </div>

        <div>
          <label htmlFor="reel-brand-name" className={settingsLabelClassName}>
            Brand Name
          </label>
          <input
            id="reel-brand-name"
            type="text"
            value={value.brandName}
            disabled={isLoading}
            onChange={(event) => onChange("brandName", event.target.value)}
            placeholder="Advora"
            className={settingsInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="reel-brand-voice" className={settingsLabelClassName}>
            Brand Voice
          </label>
          <select
            id="reel-brand-voice"
            value={value.brandVoice}
            disabled={isLoading}
            onChange={(event) =>
              onChange(
                "brandVoice",
                event.target.value as ReelScriptInput["brandVoice"]
              )
            }
            className={settingsSelectClassName}
            style={settingsSelectStyle}
          >
            {REEL_BRAND_VOICES.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="reel-target-audience"
            className={settingsLabelClassName}
          >
            Target Audience
          </label>
          <input
            id="reel-target-audience"
            type="text"
            value={value.targetAudience}
            disabled={isLoading}
            onChange={(event) =>
              onChange("targetAudience", event.target.value)
            }
            placeholder="e.g. Gen Z founders building D2C brands"
            className={settingsInputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="reel-platform" className={settingsLabelClassName}>
            Platform
          </label>
          <select
            id="reel-platform"
            value={value.platform}
            disabled={isLoading}
            onChange={(event) =>
              onChange(
                "platform",
                event.target.value as ReelScriptInput["platform"]
              )
            }
            className={settingsSelectClassName}
            style={settingsSelectStyle}
          >
            {REEL_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {REEL_PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reel-duration" className={settingsLabelClassName}>
            Reel Duration
          </label>
          <select
            id="reel-duration"
            value={value.duration}
            disabled={isLoading}
            onChange={(event) =>
              onChange(
                "duration",
                Number(event.target.value) as ReelScriptInput["duration"]
              )
            }
            className={settingsSelectClassName}
            style={settingsSelectStyle}
          >
            {REEL_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration}s
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="reel-goal" className={settingsLabelClassName}>
            Goal
          </label>
          <select
            id="reel-goal"
            value={value.goal}
            disabled={isLoading}
            onChange={(event) =>
              onChange("goal", event.target.value as ReelScriptInput["goal"])
            }
            className={settingsSelectClassName}
            style={settingsSelectStyle}
          >
            {REEL_GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {REEL_GOAL_LABELS[goal]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Costs 10 credits · Saved to workspace history automatically
        </p>
        <button
          type="submit"
          disabled={
            isLoading ||
            !value.productDescription.trim() ||
            !value.brandName.trim() ||
            !value.targetAudience.trim()
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Generating…" : "Generate Reel Script"}
        </button>
      </div>
    </form>
  );
}

export { EMPTY_REEL_SCRIPT_INPUT };
