import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    hooks: [
      "Stop wasting money on bad ads",
      "The easiest way to boost conversions",
      "Why customers are switching today",
      "Your competitors don't want you to know this",
      "Results that speak for themselves"
    ],
    captions: [
      "Premium quality product designed for maximum performance.",
      "Trusted by customers who value quality and results.",
      "Upgrade your experience with a smarter solution."
    ],
    ctas: [
      "Shop Now",
      "Get Yours Today",
      "Try It Risk Free"
    ],
    ugcScript:
      "[HOOK] I wasn't expecting this... [PROBLEM] Nothing else worked. [DEMO] Then I tried this product. [CTA] Check it out today."
  });
}