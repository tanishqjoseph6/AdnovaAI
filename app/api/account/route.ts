import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const user = authResult.user;
    const now = new Date().toISOString();

    if (!hasAdminCredentials()) {
      return NextResponse.json(
        {
          error:
            "Account deletion is temporarily unavailable. Please contact support.",
        },
        { status: 503 }
      );
    }

    const admin = createAdminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Account deletion profile lookup failed:", profileError);
      return NextResponse.json(
        { error: "Unable to delete account. Please try again." },
        { status: 500 }
      );
    }

    if (profile?.role === "owner") {
      return NextResponse.json(
        { error: "Owner accounts cannot be deleted from settings." },
        { status: 403 }
      );
    }

    if (profile?.account_status === "deleted") {
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        account_status: "deleted",
        deleted_at: now,
        updated_at: now,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Account deletion status update failed:", updateError);
      return NextResponse.json(
        { error: "Unable to delete account. Please try again." },
        { status: 500 }
      );
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Account deletion sign-out failed:", signOutError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Unable to delete account. Please try again." },
      { status: 500 }
    );
  }
}
