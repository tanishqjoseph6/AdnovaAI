import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { validateAvatarFile } from "@/lib/settings/avatar";
import {
  persistProfileAvatarUrl,
  removeUserAvatarFiles,
  uploadUserAvatar,
} from "@/lib/settings/avatar-server";
import { createClient } from "@/lib/supabase/server";

function getAvatarFile(formData: FormData): File | null {
  const value = formData.get("avatar");
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const formData = await request.formData();
    const file = getAvatarFile(formData);

    if (!file) {
      return NextResponse.json(
        { error: "Choose a profile photo to upload." },
        { status: 400 }
      );
    }

    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const user = authResult.user;
    const uploaded = await uploadUserAvatar(
      supabase,
      user.id,
      file,
      validation.mime
    );

    if (!uploaded) {
      return NextResponse.json(
        { error: "Unable to upload profile photo. Please try again." },
        { status: 500 }
      );
    }

    const cacheBustedUrl = `${uploaded.publicUrl}?v=${Date.now()}`;
    const saved = await persistProfileAvatarUrl(
      supabase,
      user.id,
      user.email,
      cacheBustedUrl
    );

    if (!saved) {
      await supabase.storage.from("profile-avatars").remove([uploaded.storagePath]);
      return NextResponse.json(
        { error: "Photo uploaded but profile could not be updated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: saved.avatarUrl,
    });
  } catch (error) {
    console.error("Profile avatar upload error:", error);
    return NextResponse.json(
      { error: "Unable to upload profile photo. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const user = authResult.user;
    await removeUserAvatarFiles(supabase, user.id);

    const saved = await persistProfileAvatarUrl(
      supabase,
      user.id,
      user.email,
      null
    );

    if (!saved) {
      return NextResponse.json(
        { error: "Unable to remove profile photo. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: null,
    });
  } catch (error) {
    console.error("Profile avatar delete error:", error);
    return NextResponse.json(
      { error: "Unable to remove profile photo. Please try again." },
      { status: 500 }
    );
  }
}
