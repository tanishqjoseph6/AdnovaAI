import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  campaignFromRow,
  isValidCampaignColor,
  type CampaignRow,
} from "@/lib/campaign-calendar/campaigns";
import { CAMPAIGN_COLORS } from "@/lib/social-scheduler/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", authResult.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Campaigns fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load campaigns." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaigns: (data ?? []).map((row) =>
        campaignFromRow(row as CampaignRow)
      ),
    });
  } catch (error) {
    console.error("Campaigns fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load campaigns." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Campaign name is required (max 80 characters)." },
        { status: 400 }
      );
    }

    const color =
      typeof body.color === "string" && isValidCampaignColor(body.color)
        ? body.color.trim()
        : CAMPAIGN_COLORS[0];
    const visibility = body.visibility === "team" ? "team" : "private";
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 500) || null
        : null;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: authResult.user.id,
        name,
        description,
        color,
        visibility,
        starts_at:
          typeof body.startsAt === "string" ? body.startsAt : null,
        ends_at: typeof body.endsAt === "string" ? body.endsAt : null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Campaign create failed:", error);
      return NextResponse.json(
        { error: "Unable to create campaign." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: campaignFromRow(data as CampaignRow),
    });
  } catch (error) {
    console.error("Campaign create error:", error);
    return NextResponse.json(
      { error: "Unable to create campaign." },
      { status: 500 }
    );
  }
}
