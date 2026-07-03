import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { isPaidPlan, type PlanId } from "@/lib/billing/plans";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UserActionPayload = {
  action?: unknown;
  credits?: unknown;
  plan?: unknown;
};

function isPlan(value: unknown): value is PlanId {
  return (
    value === "free" ||
    value === "starter" ||
    value === "pro" ||
    value === "custom"
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as UserActionPayload;
    const action = typeof body.action === "string" ? body.action : "";
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await authResult.admin
      .from("profiles")
      .select("id, email, role")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      console.error("Admin user action lookup failed:", existingError);
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (existing.role === "owner") {
      return NextResponse.json(
        { error: "Owner account cannot be modified here." },
        { status: 403 }
      );
    }

    if (action === "suspend" || action === "unsuspend" || action === "delete") {
      const update =
        action === "suspend"
          ? { account_status: "suspended", suspended_at: now, updated_at: now }
          : action === "unsuspend"
            ? { account_status: "active", suspended_at: null, updated_at: now }
            : { account_status: "deleted", deleted_at: now, updated_at: now };

      const { error } = await authResult.admin
        .from("profiles")
        .update(update)
        .eq("id", id);

      if (error) {
        console.error("Admin user status update failed:", error);
        return NextResponse.json(
          { error: "Unable to update user status." },
          { status: 500 }
        );
      }

      await logAdminAction({
        admin: authResult.admin,
        user: authResult.user,
        action: `user_${action}`,
        targetType: "user",
        targetId: id,
        metadata: { email: existing.email },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "edit_credits") {
      const credits = typeof body.credits === "number" ? body.credits : NaN;
      if (!Number.isInteger(credits) || credits < 0 || credits > 100000) {
        return NextResponse.json(
          { error: "Credits must be a valid non-negative integer." },
          { status: 400 }
        );
      }

      const { error } = await authResult.admin.from("user_credits").upsert(
        {
          user_id: id,
          credits,
          plan: credits > 0 ? "free" : "free",
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Admin credits update failed:", error);
        return NextResponse.json(
          { error: "Unable to update credits." },
          { status: 500 }
        );
      }

      await logAdminAction({
        admin: authResult.admin,
        user: authResult.user,
        action: "user_edit_credits",
        targetType: "user",
        targetId: id,
        metadata: { credits },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "change_plan") {
      if (!isPlan(body.plan)) {
        return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
      }

      const plan = body.plan;
      const { error } = await authResult.admin
        .from("profiles")
        .update({
          plan,
          subscription_status: isPaidPlan(plan) ? "active" : "inactive",
          updated_at: now,
        })
        .eq("id", id);

      if (error) {
        console.error("Admin plan update failed:", error);
        return NextResponse.json(
          { error: "Unable to update plan." },
          { status: 500 }
        );
      }

      await logAdminAction({
        admin: authResult.admin,
        user: authResult.user,
        action: "user_change_plan",
        targetType: "user",
        targetId: id,
        metadata: { plan },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "Unable to update user." },
      { status: 500 }
    );
  }
}
