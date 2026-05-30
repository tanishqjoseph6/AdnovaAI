import type { GenerateAdsResponse } from "@/lib/validations/generate-ads";

export type AiOutputData = GenerateAdsResponse & {
  ctas?: string[];
};

export const defaultCtaSuggestions = [
  "Shop Now — Free Shipping",
  "Get 20% Off Today",
  "Try Risk-Free for 30 Days",
  "Claim Yours →",
  "Limited Stock — Order Now",
];

export const mockAiOutput: AiOutputData = {
  hooks: [
    "Stop scrolling if you hate tangled wires.",
    "Your gym playlist deserves better sound.",
    "The earbuds creators won't shut up about.",
    "48-hour battery. Zero compromises.",
    "Finally—wireless audio that stays put.",
  ],
  captions: [
    "Meet the earbuds built for people who never sit still. Crystal-clear audio, all-day comfort, and a case that fits in your smallest pocket. Tap to shop — free shipping this week only. 🎧",
    "Why settle for 'good enough'? Our wireless earbuds deliver studio-grade sound at half the price of the big brands. Join 50K+ happy listeners. Link in bio.",
    "Sound this good shouldn't cost a fortune. Premium drivers, sweat-resistant fit, and a battery that outlasts your longest day. Shop the drop before it's gone.",
  ],
  ugcScript: `[HOOK - 0:00]
Okay so I've been using these earbuds for two weeks and I need to talk about them...

[PROBLEM - 0:05]
Every pair I've owned either falls out mid-run or dies after like three hours. Annoying.

[DEMO - 0:12]
(show product) These stay locked in, the bass is insane, and I literally forgot to charge them for two days — still going.

[SOCIAL PROOF - 0:22]
My roommate stole mine and ordered her own the same day. Not even joking.

[CTA - 0:28]
They're on sale right now — I'll drop the link. You're welcome.`,
  ctas: defaultCtaSuggestions,
};
