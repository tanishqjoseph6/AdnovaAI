import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  contentToGenerationUpdate,
  deleteContentItem,
  generationContentFromRow,
  restoreOriginalContentItem,
  toggleSavedContentItem,
  updateContentItem,
} from "@/lib/content-editor/generation-content";
import { isContentKind } from "@/lib/content-editor/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type ContentUpdateAction = "update" | "delete" | "save" | "restore";

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      kind?: unknown;
      index?: unknown;
      value?: unknown;
      saved?: unknown;
    };

    const action = body.action as ContentUpdateAction;
    if (!["update", "delete", "save", "restore"].includes(action)) {
      return NextResponse.json({ error: "Invalid editor action." }, { status: 400 });
    }

    if (!isContentKind(body.kind)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const index =
      typeof body.index === "number" && Number.isInteger(body.index)
        ? body.index
        : undefined;

    if (body.kind !== "ugcScript" && typeof index !== "number") {
      return NextResponse.json(
        { error: "Content index is required." },
        { status: 400 }
      );
    }

    const ownerKeys = [authResult.user.email ?? "", authResult.user.id];
    const db = hasAdminCredentials() ? createAdminClient() : supabase;
    const { data: generations, error: fetchError } = await db
      .from("generations")
      .select("*")
      .eq("id", id)
      .in("user_email", ownerKeys)
      .limit(2);

    if (fetchError) {
      console.error("Generation content fetch failed:", fetchError.message);
      return NextResponse.json(
        { error: "Unable to load this generation." },
        { status: 500 }
      );
    }

    if (!generations?.length) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    if (generations.length !== 1) {
      console.error(
        `Generation content fetch returned ${generations.length} rows for id ${id}.`
      );
      return NextResponse.json(
        { error: "Unable to safely edit this generation." },
        { status: 409 }
      );
    }

    const generation = generations[0];
    const current = generationContentFromRow(generation);
    let next = current;

    if (action === "update") {
      const value = typeof body.value === "string" ? body.value.trim() : "";
      if (!value) {
        return NextResponse.json(
          { error: "Edited content cannot be empty." },
          { status: 400 }
        );
      }
      next = updateContentItem(current, body.kind, value, index);
    }

    if (action === "delete") {
      next = deleteContentItem(current, body.kind, index);
    }

    if (action === "save") {
      next = toggleSavedContentItem(current, body.kind, body.saved !== false, index);
    }

    if (action === "restore") {
      next = restoreOriginalContentItem(current, body.kind, index);
    }

    const { data: updatedRows, error: updateError } = await db
      .from("generations")
      .update(contentToGenerationUpdate(next))
      .eq("id", id)
      .in("user_email", ownerKeys)
      .select("*");

    if (updateError) {
      console.error("Generation content update failed:", updateError.message);
      return NextResponse.json(
        { error: "Unable to save this edit." },
        { status: 500 }
      );
    }

    if (!updatedRows?.length) {
      console.error(`Generation content update returned no rows for id ${id}.`);
      return NextResponse.json(
        { error: "Generation not found." },
        { status: 404 }
      );
    }

    if (updatedRows.length !== 1) {
      console.error(
        `Generation content update returned ${updatedRows.length} rows for id ${id}.`
      );
      return NextResponse.json(
        { error: "Unable to safely save this edit." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      content: generationContentFromRow(updatedRows[0]),
    });
  } catch (error) {
    console.error("Generation content edit error:", error);
    return NextResponse.json(
      { error: "Unable to save this edit." },
      { status: 500 }
    );
  }
}
