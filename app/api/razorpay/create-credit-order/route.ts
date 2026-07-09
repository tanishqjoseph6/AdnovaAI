import { NextResponse } from "next/server";

/**
 * POST /api/razorpay/create-credit-order
 * Credit pack checkout is UI-only until USD billing is wired.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Credit pack checkout is not available yet." },
    { status: 501 }
  );
}
