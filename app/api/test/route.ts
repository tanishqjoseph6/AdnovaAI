import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      error:
        "This debug route is disabled. Use authenticated admin tooling instead.",
    },
    { status: 410 }
  );
}
