import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  campaignFromRow,
  isValidCampaignColor,
  type CampaignRow,
} from "@/lib/campaign-calendar/campaigns";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name || name.length > 80) {
        return NextResponse.json(
          { error: "Campaign name is required (max 80 characters)." },
          { status: 400 }
        );
      }
      patch.name = name;
    }

    if (typeof body.description === "string") {
      patch.description = body.description.trim().slice(0, 500) || null;
    }

    if (typeof body.color === "string") {
      if (!isValidCampaignColor(body.color)) {
        return NextResponse.json(
          { error: "Invalid campaign color." },
          { status: 400 }
        );
      }
      patch.color = body.color.trim();
    }

    if (body.visibility === "private" || body.visibility === "team") {
      patch.visibility = body.visibility;
    }

    if (typeof body.startsAt === "string" || body.startsAt === null) {
      patch.starts_at = body.startsAt;
    }
    if (typeof body.endsAt === "string" || body.endsAt === null) {
      patch.ends_at = body.endsAt;
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update(patch)
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Campaign update failed:", error);
      return NextResponse.json(
        { error: "Unable to update campaign." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign: campaignFromRow(data as CampaignRow),
    });
  } catch (error) {
    console.error("Campaign update error:", error);
    return NextResponse.json(
      { error: "Unable to update campaign." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.user.id);

    if (error) {
      console.error("Campaign delete failed:", error);
      return NextResponse.json(
        { error: "Unable to delete campaign." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign delete error:", error);
    return NextResponse.json(
      { error: "Unable to delete campaign." },
      { status: 500 }
    );
  }
}
