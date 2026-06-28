import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  isDuplicateUsernameError,
  validateProfileSettings,
} from "@/lib/settings/profile";
import { createClient } from "@/lib/supabase/server";

type ProfileUpdatePayload = {
  username?: unknown;
  fullName?: unknown;
  avatarUrl?: unknown;
};

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as ProfileUpdatePayload;
    const validation = validateProfileSettings({
      username: typeof body.username === "string" ? body.username : "",
      fullName: typeof body.fullName === "string" ? body.fullName : "",
      avatarUrl:
        typeof body.avatarUrl === "string" ? body.avatarUrl : null,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = authResult.user;
    const { username, fullName, avatarUrl } = validation.value;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? null,
        username,
        full_name: fullName || null,
        avatar_url: avatarUrl,
        updated_at: now,
      }, {
        onConflict: "id",
      })
      .select("id, email, username, full_name, avatar_url")
      .single();

    if (error) {
      if (isDuplicateUsernameError(error.message)) {
        return NextResponse.json(
          { error: "This username is already taken." },
          { status: 409 }
        );
      }

      console.error("Profile update failed:", error.message);
      return NextResponse.json(
        { error: "Unable to save profile changes. Please try again." },
        { status: 500 }
      );
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        username,
        full_name: fullName || null,
        name: fullName || username,
        avatar_url: avatarUrl,
      },
    });

    if (metadataError) {
      console.error("Profile metadata update failed:", metadataError.message);
      return NextResponse.json(
        { error: "Profile saved, but session refresh failed. Please refresh." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: data.id,
        email: data.email,
        username: data.username,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Unable to save profile changes. Please try again." },
      { status: 500 }
    );
  }
}
