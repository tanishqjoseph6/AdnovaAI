import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  getAvatarPublicUrl,
  getAvatarStoragePath,
  isAllowedAvatarUrl,
  validateAvatarFile,
} from "./avatar";

describe("avatar helpers", () => {
  it("builds storage paths by mime type", () => {
    assert.equal(
      getAvatarStoragePath("user-123", "image/png"),
      "user-123/avatar.png"
    );
  });

  it("validates avatar files", () => {
    const valid = validateAvatarFile({
      type: "image/jpeg",
      size: 1024,
    } as File);
    assert.equal(valid.ok, true);

    const invalid = validateAvatarFile({
      type: "application/pdf",
      size: 1024,
    } as File);
    assert.equal(invalid.ok, false);
  });

  it("allows only profile-avatars public URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.equal(
      isAllowedAvatarUrl(
        "https://example.supabase.co/storage/v1/object/public/profile-avatars/user/avatar.jpg"
      ),
      true
    );
    assert.equal(isAllowedAvatarUrl("https://evil.example/avatar.jpg"), false);
    assert.equal(isAllowedAvatarUrl(null), true);
  });

  it("builds public avatar URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.equal(
      getAvatarPublicUrl("user-1/avatar.webp"),
      "https://example.supabase.co/storage/v1/object/public/profile-avatars/user-1/avatar.webp"
    );
  });
});

describe("profile avatars storage migration", () => {
  const migration = readFileSync(
    join(
      process.cwd(),
      "supabase",
      "migrations",
      "20250726_profile_avatars_storage.sql"
    ),
    "utf8"
  );

  it("creates public profile-avatars bucket and policies", () => {
    assert.match(migration, /profile-avatars/);
    assert.match(migration, /Users upload own profile avatars/);
    assert.match(migration, /Public read profile avatars/);
  });
});
