import { STARTER_PLAN_CREDITS } from "@/lib/credits/plan-config";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReferralStats = {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingReferrals: number;
  successfulReferrals: number;
  creditsEarned: number;
  starterUnlocked: boolean;
  starterExpiresAt: string | null;
  referrals: Array<{
    id: string;
    referredEmail: string;
    status: "pending" | "successful" | "blocked";
    signupAt: string;
    emailVerifiedAt: string | null;
    onboardingCompletedAt: string | null;
    firstGenerationAt: string | null;
  }>;
  rewards: Array<{
    id: string;
    rewardType: "credits" | "starter_month";
    creditsAmount: number;
    description: string;
    createdAt: string;
  }>;
};

export type ReferralServiceError = {
  code: "missing_credentials" | "migration_required" | "unknown";
  message: string;
  details?: string;
};

export type ReferralStatsResult =
  | { ok: true; stats: ReferralStats }
  | { ok: false; error: ReferralServiceError };

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function requireAdminClient() {
  if (!hasAdminCredentials()) {
    throw new Error("Missing Supabase service role credentials");
  }
  return createAdminClient();
}

function referralServiceError(
  code: ReferralServiceError["code"],
  message: string,
  error?: unknown
): ReferralServiceError {
  return {
    code,
    message,
    details: error instanceof Error ? error.message : undefined,
  };
}

function isMissingReferralSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";

  return (
    code === "42P01" ||
    code === "42703" ||
    /referral_codes|referrals|referral_rewards|does not exist|schema cache/i.test(
      message
    )
  );
}

function logReferralError(message: string, error: unknown) {
  if (error && typeof error === "object") {
    const record = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    console.error(message, {
      code: record.code,
      message: record.message,
      details: record.details,
      hint: record.hint,
    });
    return;
  }

  console.error(message, error);
}

function normalizeCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

function codeCandidates(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
}): string[] {
  const username = input.username ? normalizeCode(input.username) : "";
  const emailLocal = input.email?.split("@")[0]
    ? normalizeCode(input.email.split("@")[0])
    : "";
  const fallback = `adv${input.userId.replace(/-/g, "").slice(0, 10)}`;
  return [username, emailLocal, fallback].filter(
    (candidate) => candidate.length >= 3
  );
}

export async function getOrCreateReferralCode(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
}): Promise<string> {
  const admin = requireAdminClient();
  const existing = await admin
    .from("referral_codes")
    .select("code")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.code) {
    return existing.data.code;
  }

  const candidates = codeCandidates(input);
  for (const base of candidates) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = attempt === 0 ? "" : `${attempt + 1}`;
      const code = normalizeCode(`${base}${suffix}`);
      const { error } = await admin.from("referral_codes").insert({
        user_id: input.userId,
        code,
      });

      if (!error) {
        return code;
      }

      if (!/duplicate|unique/i.test(error.message)) {
        throw error;
      }
    }
  }

  const code = `adv${Date.now().toString().slice(-8)}${input.userId.slice(0, 4)}`;
  const { error } = await admin.from("referral_codes").insert({
    user_id: input.userId,
    code,
  });
  if (error) {
    throw error;
  }
  return code;
}

export async function tryCreateReferralCode(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
}): Promise<string | null> {
  try {
    return await getOrCreateReferralCode(input);
  } catch (error) {
    logReferralError("Referral code creation failed:", error);
    return null;
  }
}

export async function recordReferralSignup(input: {
  referredUserId: string;
  referredEmail: string;
  referralCode?: string | null;
}): Promise<void> {
  const code = input.referralCode ? normalizeCode(input.referralCode) : "";
  if (!code) {
    return;
  }

  const admin = requireAdminClient();
  const { data: codeRow, error: codeError } = await admin
    .from("referral_codes")
    .select("user_id, code")
    .eq("code", code)
    .maybeSingle();

  if (codeError) {
    throw codeError;
  }

  if (!codeRow || codeRow.user_id === input.referredUserId) {
    return;
  }

  const emailLower = input.referredEmail.trim().toLowerCase();
  const now = new Date().toISOString();
  const { error } = await admin.from("referrals").insert({
    referral_code: codeRow.code,
    referrer_user_id: codeRow.user_id,
    referred_user_id: input.referredUserId,
    referred_email_lower: emailLower,
    signup_at: now,
    updated_at: now,
  });

  if (error && !/duplicate|unique|referrals_no_self_referral/i.test(error.message)) {
    throw error;
  }
}

export async function tryRecordReferralSignup(input: {
  referredUserId: string;
  referredEmail: string;
  referralCode?: string | null;
}): Promise<void> {
  try {
    await recordReferralSignup(input);
  } catch (error) {
    logReferralError("Referral signup tracking failed:", error);
  }
}

export async function markReferralOnboardingComplete(input: {
  userId: string;
  emailVerified: boolean;
}): Promise<void> {
  if (!input.emailVerified || !hasAdminCredentials()) {
    return;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("referrals")
    .update({
      email_verified_at: now,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq("referred_user_id", input.userId)
    .eq("status", "pending")
    .is("onboarding_completed_at", null);

  if (error) {
    logReferralError("Referral onboarding milestone failed:", error);
  }
}

async function grantStarterMonth(referrerUserId: string): Promise<boolean> {
  const admin = requireAdminClient();
  const rewardKey = `starter_month:${referrerUserId}`;
  const now = new Date();

  const { error: rewardError } = await admin.from("referral_rewards").insert({
    user_id: referrerUserId,
    reward_key: rewardKey,
    reward_type: "starter_month",
    credits_amount: 0,
    description: "Starter Plan unlocked free for 1 month",
    created_at: now.toISOString(),
  });

  if (rewardError) {
    if (/duplicate|unique/i.test(rewardError.message)) {
      return false;
    }
    throw rewardError;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      plan: "starter",
      subscription_status: "active",
      purchase_date: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", referrerUserId);

  if (profileError) {
    throw profileError;
  }

  const { error: creditsError } = await admin.from("user_credits").upsert(
    {
      user_id: referrerUserId,
      plan: "free",
      credits: STARTER_PLAN_CREDITS,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (creditsError) {
    throw creditsError;
  }

  return true;
}

export async function completeReferralAfterFirstGeneration(input: {
  referredUserId: string;
}): Promise<{ creditAwarded: boolean; starterUnlocked: boolean }> {
  if (!hasAdminCredentials()) {
    return { creditAwarded: false, starterUnlocked: false };
  }

  const admin = createAdminClient();
  const { data: referrals, error: fetchError } = await admin
    .from("referrals")
    .select("*")
    .eq("referred_user_id", input.referredUserId)
    .eq("status", "pending")
    .limit(1);

  if (fetchError) {
    throw fetchError;
  }

  const referral = referrals?.[0];
  if (!referral || !referral.email_verified_at || !referral.onboarding_completed_at) {
    return { creditAwarded: false, starterUnlocked: false };
  }

  const now = new Date().toISOString();
  const { error: referralUpdateError } = await admin
    .from("referrals")
    .update({
      status: "successful",
      first_generation_at: now,
      reward_granted_at: now,
      updated_at: now,
    })
    .eq("id", referral.id)
    .eq("status", "pending");

  if (referralUpdateError) {
    throw referralUpdateError;
  }

  let creditAwarded = false;
  const rewardKey = `referral_credit:${referral.id}`;
  const { error: rewardError } = await admin.from("referral_rewards").insert({
    user_id: referral.referrer_user_id,
    referral_id: referral.id,
    reward_key: rewardKey,
    reward_type: "credits",
    credits_amount: 10,
    description: "+10 credits for a successful verified referral",
    created_at: now,
  });

  if (!rewardError) {
    creditAwarded = true;
    const { data: creditsRow, error: creditReadError } = await admin
      .from("user_credits")
      .select("credits, plan")
      .eq("user_id", referral.referrer_user_id)
      .maybeSingle();

    if (creditReadError) {
      throw creditReadError;
    }

    if (creditsRow?.plan !== "pro") {
      const currentCredits =
        typeof creditsRow?.credits === "number" ? creditsRow.credits : 0;
      const { error: creditUpdateError } = await admin.from("user_credits").upsert(
        {
          user_id: referral.referrer_user_id,
          credits: currentCredits + 10,
          plan: "free",
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (creditUpdateError) {
        throw creditUpdateError;
      }
    }
  } else if (!/duplicate|unique/i.test(rewardError.message)) {
    throw rewardError;
  }

  const { count, error: countError } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_user_id", referral.referrer_user_id)
    .eq("status", "successful");

  if (countError) {
    throw countError;
  }

  const starterUnlocked =
    (count ?? 0) >= 10
      ? await grantStarterMonth(referral.referrer_user_id)
      : false;

  return { creditAwarded, starterUnlocked };
}

async function verifyReferralSchema(): Promise<ReferralServiceError | null> {
  if (!hasAdminCredentials()) {
    return referralServiceError(
      "missing_credentials",
      "Referral rewards need Supabase service-role credentials."
    );
  }

  const admin = createAdminClient();
  const checks = await Promise.all([
    admin.from("referral_codes").select("user_id", { head: true }).limit(1),
    admin.from("referrals").select("id", { head: true }).limit(1),
    admin.from("referral_rewards").select("id", { head: true }).limit(1),
  ]);

  const failed = checks.find((check) => check.error);
  if (!failed?.error) {
    return null;
  }

  if (isMissingReferralSchemaError(failed.error)) {
    return referralServiceError(
      "migration_required",
      "Referral database migrations have not been applied yet.",
      failed.error
    );
  }

  return referralServiceError(
    "unknown",
    "Unable to verify referral database tables.",
    failed.error
  );
}

export async function getReferralStats(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
  origin: string;
}): Promise<ReferralStats> {
  const admin = requireAdminClient();
  const referralCode = await getOrCreateReferralCode(input);
  const referralLink = `${input.origin.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(referralCode)}`;

  const [referralsResult, rewardsResult] = await Promise.all([
    admin
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", input.userId)
      .order("created_at", { ascending: false }),
    admin
      .from("referral_rewards")
      .select("*")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false }),
  ]);

  if (referralsResult.error) throw referralsResult.error;
  if (rewardsResult.error) throw rewardsResult.error;

  const referrals = referralsResult.data ?? [];
  const rewards = rewardsResult.data ?? [];
  const successfulReferrals = referrals.filter(
    (referral) => referral.status === "successful"
  ).length;

  return {
    referralCode,
    referralLink,
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter((referral) => referral.status === "pending")
      .length,
    successfulReferrals,
    creditsEarned: rewards
      .filter((reward) => reward.reward_type === "credits")
      .reduce((total, reward) => total + (reward.credits_amount ?? 0), 0),
    starterUnlocked: rewards.some(
      (reward) => reward.reward_type === "starter_month"
    ),
    starterExpiresAt: null,
    referrals: referrals.map((referral) => ({
      id: referral.id,
      referredEmail: referral.referred_email_lower,
      status: referral.status,
      signupAt: referral.signup_at,
      emailVerifiedAt: referral.email_verified_at,
      onboardingCompletedAt: referral.onboarding_completed_at,
      firstGenerationAt: referral.first_generation_at,
    })),
    rewards: rewards.map((reward) => ({
      id: reward.id,
      rewardType: reward.reward_type,
      creditsAmount: reward.credits_amount,
      description: reward.description,
      createdAt: reward.created_at,
    })),
  };
}

export async function getReferralStatsSafe(input: {
  userId: string;
  email?: string | null;
  username?: string | null;
  origin: string;
}): Promise<ReferralStatsResult> {
  const schemaError = await verifyReferralSchema();
  if (schemaError) {
    return { ok: false, error: schemaError };
  }

  try {
    const stats = await getReferralStats(input);
    return { ok: true, stats };
  } catch (error) {
    logReferralError("Referral stats load failed:", error);
    if (isMissingReferralSchemaError(error)) {
      return {
        ok: false,
        error: referralServiceError(
          "migration_required",
          "Referral database migrations have not been applied yet.",
          error
        ),
      };
    }

    return {
      ok: false,
      error: referralServiceError(
        "unknown",
        "Unable to load referral rewards.",
        error
      ),
    };
  }
}
