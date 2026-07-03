import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";

const CATEGORIES = ["new_feature", "maintenance", "beta_update"] as const;

export async function GET() {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) return authResult.response;

    const { data, error } = await authResult.admin
      .from("announcements")
      .select("id, title, message, category, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ announcements: data ?? [] });
  } catch (error) {
    console.error("Admin announcements fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load announcements." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])
      ? (body.category as (typeof CATEGORIES)[number])
      : "beta_update";

    if (title.length < 3 || title.length > 140) {
      return NextResponse.json({ error: "Invalid title." }, { status: 400 });
    }
    if (message.length < 3 || message.length > 1000) {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const { data, error } = await authResult.admin
      .from("announcements")
      .insert({
        created_by: authResult.user.id,
        title,
        message,
        category,
        is_active: true,
      })
      .select("id, title, message, category, is_active, created_at")
      .single();

    if (error || !data) throw error;

    await logAdminAction({
      admin: authResult.admin,
      user: authResult.user,
      action: "announcement_sent",
      targetType: "announcement",
      targetId: data.id,
      metadata: { title, category },
    });

    return NextResponse.json({ success: true, announcement: data });
  } catch (error) {
    console.error("Admin announcement create error:", error);
    return NextResponse.json(
      { error: "Unable to send announcement." },
      { status: 500 }
    );
  }
}
