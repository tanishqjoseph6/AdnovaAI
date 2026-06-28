import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { DUPLICATE_EMAIL_MESSAGE } from "./errors";
import { AUTH_RATE_LIMITS } from "./rate-limit-config";

const repoRoot = process.cwd();

function readMigration(fileName: string): string {
  return readFileSync(join(repoRoot, "supabase", "migrations", fileName), "utf8");
}

describe("account eligibility messages", () => {
  it("uses the required duplicate signup message", () => {
    assert.equal(
      DUPLICATE_EMAIL_MESSAGE,
      "An account already exists with this email. Please log in."
    );
  });
});

describe("auth errors duplicate signup", () => {
  it("maps duplicate_email pattern", async () => {
    const { mapAuthErrorMessage } = await import("./errors");
    assert.equal(
      mapAuthErrorMessage("duplicate_email"),
      DUPLICATE_EMAIL_MESSAGE
    );
  });
});

describe("signup security database invariants", () => {
  const freeCreditMigration = readMigration(
    "20250703_free_credit_abuse_prevention.sql"
  );
  const hardeningMigration = readMigration(
    "20250705_signup_credit_abuse_hardening.sql"
  );

  it("enforces one profile email at the database layer", () => {
    assert.match(hardeningMigration, /profiles_email_lower_unique/);
    assert.match(hardeningMigration, /on public\.profiles \(lower\(email\)\)/);
    assert.match(hardeningMigration, /where email is not null/);
  });

  it("tracks one free-credit claim per email and per user", () => {
    assert.match(freeCreditMigration, /email_lower text primary key/);
    assert.match(freeCreditMigration, /free_credit_claims_user_id_key/);
  });

  it("keeps starter-credit grants idempotent", () => {
    assert.match(hardeningMigration, /create or replace function public\.try_claim_free_credits/);
    assert.match(hardeningMigration, /email_confirmed_at is not null/);
    assert.match(hardeningMigration, /on conflict \(email_lower\) do nothing/);
    assert.match(hardeningMigration, /on conflict \(user_id\) do nothing/);
  });

  it("blocks duplicate profile creation in the auth trigger", () => {
    assert.match(hardeningMigration, /create or replace function public\.handle_new_user/);
    assert.match(hardeningMigration, /raise exception 'duplicate_email'/);
    assert.match(hardeningMigration, /from auth\.users u/);
    assert.match(hardeningMigration, /from public\.free_credit_claims c/);
  });
});

describe("signup rate limits", () => {
  it("keeps signup rate limiting active", () => {
    assert.equal(AUTH_RATE_LIMITS.signup.maxAttempts, 5);
    assert.equal(AUTH_RATE_LIMITS.signup.windowSeconds, 60 * 60);
  });
});
