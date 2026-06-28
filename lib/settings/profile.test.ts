import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  getDefaultUsername,
  isDuplicateUsernameError,
  validateProfileSettings,
} from "./profile";

describe("profile settings validation", () => {
  it("trims names and usernames before saving", () => {
    const result = validateProfileSettings({
      username: "  advora.user  ",
      fullName: "  Advora   User  ",
      avatarUrl: "",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.username, "advora.user");
      assert.equal(result.value.fullName, "Advora User");
      assert.equal(result.value.avatarUrl, null);
    }
  });

  it("rejects invalid usernames", () => {
    assert.equal(
      validateProfileSettings({
        username: "",
        fullName: "Advora User",
        avatarUrl: "",
      }).ok,
      false
    );
    assert.equal(
      validateProfileSettings({
        username: "ab",
        fullName: "Advora User",
        avatarUrl: "",
      }).ok,
      false
    );
    assert.equal(
      validateProfileSettings({
        username: "this-username-is-way-too-long-for-the-field",
        fullName: "Advora User",
        avatarUrl: "",
      }).ok,
      false
    );
    assert.equal(
      validateProfileSettings({
        username: "bad username",
        fullName: "Advora User",
        avatarUrl: "",
      }).ok,
      false
    );
  });

  it("detects duplicate username database errors", () => {
    assert.equal(
      isDuplicateUsernameError(
        'duplicate key value violates unique constraint "profiles_username_lower_unique"'
      ),
      true
    );
  });

  it("derives a valid default username from email", () => {
    assert.equal(getDefaultUsername("User.Name+tag@example.com"), "user.nametag");
    assert.equal(getDefaultUsername("a@example.com"), "a00");
  });
});

describe("profile settings RLS migration", () => {
  const migration = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20250707_profile_settings_updates.sql"),
    "utf8"
  );

  it("adds profile fields and unique username constraint", () => {
    assert.match(migration, /add column if not exists username text/);
    assert.match(migration, /add column if not exists full_name text/);
    assert.match(migration, /add column if not exists avatar_url text/);
    assert.match(migration, /profiles_username_lower_unique/);
    assert.match(migration, /on public\.profiles \(lower\(username\)\)/);
  });

  it("allows users to update only their own profile", () => {
    assert.match(migration, /for insert/);
    assert.match(migration, /for update/);
    assert.match(migration, /using \(auth\.uid\(\) = id\)/);
    assert.match(migration, /with check \(auth\.uid\(\) = id\)/);
  });
});
