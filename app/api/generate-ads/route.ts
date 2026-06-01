import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    hooks: [
      "Build muscle faster with every scoop",
      "25g protein. Zero excuses.",
      "The protein serious athletes trust",
      "Transform your recovery routine",
      "Results start with better protein",
    ],
    captions: [
      "Fuel your workouts with premium whey protein designed for serious athletes.",
      "Recover faster, train harder, and reach your goals sooner.",
      "No added sugar. Just clean protein and real results.",
    ],
    ctas: [
      "Shop Now",
      "Start Building Muscle",
      "Try It Today",
    ],
    ugcScript:
      "I started using this whey protein a few weeks ago and the difference has been incredible. Recovery is faster, workouts feel stronger, and the chocolate flavor is amazing.",
  });
}