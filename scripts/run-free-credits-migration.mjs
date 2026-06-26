/**
 * Applies 20250628_normalize_free_plan_credits.sql via the Supabase admin client,
 * then verifies free users, paid plans, and credit deduction.
 *
 * Usage: node scripts/run-free-credits-migration.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FREE_CREDITS = 5;
const PAID_PLANS = ["starter", "pro", "custom"];

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local optional if vars are already exported
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function snapshotPaidCredits() {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, plan")
    .in("plan", PAID_PLANS);

  if (error) throw error;

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) {
    return { profiles: [], credits: [] };
  }

  const { data: credits, error: creditsError } = await admin
    .from("user_credits")
    .select("user_id, credits, plan")
    .in("user_id", ids);

  if (creditsError) throw creditsError;

  return { profiles: profiles ?? [], credits: credits ?? [] };
}

async function applyMigration() {
  const { data: freeProfiles, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("plan", "free");

  if (profileError) throw profileError;

  const freeIds = (freeProfiles ?? []).map((p) => p.id);
  const now = new Date().toISOString();

  if (freeIds.length > 0) {
    const { error: updateError } = await admin
      .from("user_credits")
      .update({ credits: FREE_CREDITS, plan: "free", updated_at: now })
      .in("user_id", freeIds);

    if (updateError) throw updateError;
  }

  for (const userId of freeIds) {
    const { error: upsertError } = await admin.from("user_credits").upsert(
      {
        user_id: userId,
        credits: FREE_CREDITS,
        plan: "free",
        updated_at: now,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    if (upsertError) throw upsertError;
  }

  return freeIds.length;
}

async function verifyFreeUsers() {
  const { data: rows, error } = await admin
    .from("profiles")
    .select("id, plan, user_credits(credits, plan)")
    .eq("plan", "free");

  if (error) throw error;

  const issues = [];

  for (const row of rows ?? []) {
    const credits = row.user_credits;
    const creditRow = Array.isArray(credits) ? credits[0] : credits;

    if (!creditRow) {
      issues.push({ userId: row.id, reason: "missing user_credits row" });
      continue;
    }

    if (creditRow.credits !== FREE_CREDITS || creditRow.plan !== "free") {
      issues.push({
        userId: row.id,
        reason: `expected credits=5 plan=free, got credits=${creditRow.credits} plan=${creditRow.plan}`,
      });
    }
  }

  return { total: rows?.length ?? 0, issues };
}

function paidCreditsUnchanged(before, after) {
  const beforeMap = new Map(
    before.credits.map((c) => [c.user_id, `${c.credits}:${c.plan}`])
  );
  const afterMap = new Map(
    after.credits.map((c) => [c.user_id, `${c.credits}:${c.plan}`])
  );

  const changes = [];

  for (const [userId, snapshot] of beforeMap) {
    if (afterMap.get(userId) !== snapshot) {
      changes.push({ userId, before: snapshot, after: afterMap.get(userId) });
    }
  }

  for (const [userId, snapshot] of afterMap) {
    if (!beforeMap.has(userId)) {
      changes.push({ userId, before: null, after: snapshot });
    }
  }

  return changes;
}

async function testDeduction() {
  const { data: candidate, error } = await admin
    .from("profiles")
    .select("id, user_credits(credits, plan)")
    .eq("plan", "free")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!candidate) {
    return { skipped: true, reason: "no free users in database" };
  }

  const creditRow = Array.isArray(candidate.user_credits)
    ? candidate.user_credits[0]
    : candidate.user_credits;

  if (!creditRow || creditRow.credits < 1) {
    return { skipped: true, reason: "free user has no credits to deduct" };
  }

  const userId = candidate.id;
  const before = creditRow.credits;

  const { data: locked, error: readError } = await admin
    .from("user_credits")
    .select("credits, plan")
    .eq("user_id", userId)
    .single();

  if (readError) throw readError;

  const nextCredits = locked.credits - 1;
  const { data: updated, error: updateError } = await admin
    .from("user_credits")
    .update({
      credits: nextCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("credits", locked.credits)
    .eq("plan", "free")
    .select("credits")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    return { skipped: true, reason: "optimistic deduct lost race" };
  }

  // Restore credits so we do not consume a real user's credit permanently.
  const { error: restoreError } = await admin
    .from("user_credits")
    .update({
      credits: before,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (restoreError) throw restoreError;

  return {
    skipped: false,
    userId,
    before,
    deductedTo: updated.credits,
    restoredTo: before,
  };
}

async function main() {
  console.log("=== Free credits migration ===\n");

  const paidBefore = await snapshotPaidCredits();
  console.log(
    `Paid-plan users before: ${paidBefore.profiles.length} profiles, ${paidBefore.credits.length} credit rows`
  );

  const updatedCount = await applyMigration();
  console.log(`Updated / ensured credits for ${updatedCount} free profile(s).\n`);

  const paidAfter = await snapshotPaidCredits();
  const paidChanges = paidCreditsUnchanged(paidBefore, paidAfter);

  if (paidChanges.length > 0) {
    console.error("FAIL: Paid-plan credit rows changed:", paidChanges);
    process.exit(1);
  }
  console.log("OK: Starter / Pro / Business credit rows unchanged.\n");

  const verification = await verifyFreeUsers();
  if (verification.issues.length > 0) {
    console.error("FAIL: Free user verification issues:", verification.issues);
    process.exit(1);
  }
  console.log(
    `OK: All ${verification.total} free profile(s) have exactly ${FREE_CREDITS} credits (plan=free).\n`
  );

  const deduction = await testDeduction();
  if (deduction.skipped) {
    console.log(`Deduction test skipped: ${deduction.reason}`);
  } else {
    console.log(
      `OK: Deduction test user ${deduction.userId}: ${deduction.before} → ${deduction.deductedTo} (restored to ${deduction.restoredTo})`
    );
  }

  console.log("\nMigration and verification completed successfully.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
