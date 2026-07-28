import type {
  ReelScriptResult,
  ReelScriptScene,
} from "@/lib/reel-script/types";
import { createEmptyReelScriptResult } from "@/lib/reel-script/types";
import { reelScriptResultSchema } from "@/lib/reel-script/validation";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
}

function normalizeScene(value: unknown, index: number): ReelScriptScene | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  const visual = asString(row.visual ?? row.visualDescription);
  const cameraDirection = asString(
    row.cameraDirection ?? row.camera ?? row.camera_direction
  );
  const onScreenText = asString(row.onScreenText ?? row.on_screen_text);
  const voiceOver = asString(row.voiceOver ?? row.voice_over ?? row.vo);
  const bRoll = asString(row.bRoll ?? row.b_roll ?? row.broll);
  const timestamp = asString(row.timestamp ?? row.time ?? row.timing, `${index}s`);

  if (!visual && !voiceOver && !cameraDirection) {
    return null;
  }

  return {
    sceneNumber:
      typeof row.sceneNumber === "number"
        ? row.sceneNumber
        : typeof row.scene_number === "number"
          ? row.scene_number
          : index + 1,
    timestamp,
    visual: visual || "Show product in use",
    cameraDirection: cameraDirection || "Medium shot, steady handheld",
    onScreenText,
    voiceOver,
    bRoll: bRoll || "Product close-up",
  };
}

export function normalizeReelScriptResult(
  payload: unknown
): ReelScriptResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const hooks = asStringArray(row.hooks).slice(0, 5);
  while (hooks.length < 5 && hooks.length > 0) {
    hooks.push(hooks[hooks.length - 1] ?? "Watch this before you buy.");
  }

  const scenesRaw = Array.isArray(row.scenes) ? row.scenes : [];
  const scenes = scenesRaw
    .map((scene, index) => normalizeScene(scene, index))
    .filter((scene): scene is ReelScriptScene => scene !== null);

  const candidate: ReelScriptResult = {
    hooks,
    scrollStoppingOpening: asString(
      row.scrollStoppingOpening ?? row.scroll_stopping_opening ?? row.opening
    ),
    scenes,
    voiceOverScript: asString(
      row.voiceOverScript ?? row.voice_over_script ?? row.voiceover
    ),
    cta: asString(row.cta),
    caption: asString(row.caption),
    hashtags: asStringArray(row.hashtags).map((tag) =>
      tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`
    ),
    thumbnailTitle: asString(
      row.thumbnailTitle ?? row.thumbnail_title ?? row.thumbnail
    ),
  };

  const parsed = reelScriptResultSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  // Soft fallback if model returns slightly short/long arrays but usable content.
  if (
    candidate.hooks.length >= 3 &&
    candidate.scenes.length >= 1 &&
    candidate.scrollStoppingOpening &&
    candidate.voiceOverScript &&
    candidate.cta &&
    candidate.caption &&
    candidate.hashtags.length >= 3 &&
    candidate.thumbnailTitle
  ) {
    const paddedHooks = [...candidate.hooks];
    while (paddedHooks.length < 5) {
      paddedHooks.push(paddedHooks[paddedHooks.length - 1] ?? candidate.hooks[0]);
    }
    return {
      ...candidate,
      hooks: paddedHooks.slice(0, 5),
    };
  }

  return null;
}

export function formatReelScriptForExport(
  result: ReelScriptResult,
  meta?: { brandName?: string; platform?: string; duration?: number }
): string {
  const lines: string[] = [];

  if (meta?.brandName || meta?.platform || meta?.duration) {
    lines.push(
      [
        meta.brandName ? `Brand: ${meta.brandName}` : null,
        meta.platform ? `Platform: ${meta.platform}` : null,
        meta.duration ? `Duration: ${meta.duration}s` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    );
    lines.push("");
  }

  lines.push("HOOKS");
  result.hooks.forEach((hook, index) => {
    lines.push(`${index + 1}. ${hook}`);
  });
  lines.push("");
  lines.push("SCROLL-STOPPING OPENING");
  lines.push(result.scrollStoppingOpening);
  lines.push("");
  lines.push("SCENE-BY-SCENE SCRIPT");
  for (const scene of result.scenes) {
    lines.push(`Scene ${scene.sceneNumber} (${scene.timestamp})`);
    lines.push(`Visual: ${scene.visual}`);
    lines.push(`Camera: ${scene.cameraDirection}`);
    lines.push(`On-screen text: ${scene.onScreenText || "—"}`);
    lines.push(`Voice-over: ${scene.voiceOver || "—"}`);
    lines.push(`B-roll: ${scene.bRoll}`);
    lines.push("");
  }
  lines.push("FULL VOICE-OVER");
  lines.push(result.voiceOverScript);
  lines.push("");
  lines.push("CTA");
  lines.push(result.cta);
  lines.push("");
  lines.push("CAPTION");
  lines.push(result.caption);
  lines.push("");
  lines.push("HASHTAGS");
  lines.push(result.hashtags.join(" "));
  lines.push("");
  lines.push("THUMBNAIL TITLE");
  lines.push(result.thumbnailTitle);

  return lines.join("\n");
}

export function safeEmptyResult(): ReelScriptResult {
  return createEmptyReelScriptResult();
}
