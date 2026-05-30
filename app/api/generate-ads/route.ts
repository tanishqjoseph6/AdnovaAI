import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    hooks: [
      "These headphones changed everything",
      "The sound quality shocked me",
      "Best wireless headphones under budget",
      "You'll never use wired again",
      "Premium audio without premium price"
    ],
    captions: [
      "Crystal clear sound for everyday use.",
      "Experience premium audio anywhere.",
      "Upgrade your listening experience today."
    ],
    ctas: [
      "Shop Now",
      "Order Today",
      "Get Yours Before They're Gone"
    ],
    ugcScript:
      "I have been using these headphones for a week and honestly the sound quality is amazing. The battery lasts all day and they are super comfortable. If you're looking for affordable premium headphones, these are definitely worth checking out."
  });
}