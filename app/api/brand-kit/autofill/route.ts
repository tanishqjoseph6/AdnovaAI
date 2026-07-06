import net from "node:net";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import type { BrandKitAutofill } from "@/lib/brand-kit/types";
import { createClient } from "@/lib/supabase/server";

const MAX_HTML_BYTES = 300_000;

function normalizePublicWebsiteUrl(value: unknown): URL | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const raw = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    const hostname = url.hostname.toLowerCase();
    const ipVersion = net.isIP(hostname);
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "0.0.0.0" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      (ipVersion === 4 &&
        /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
          hostname
        ))
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTag(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1] ? decodeEntities(match[1].trim()) : "";
}

function cleanTitle(title: string, hostname: string): string {
  return title
    .split(/\s+[-|•]\s+/)[0]
    .replace(/\s+official\s+site$/i, "")
    .trim() || hostname.replace(/^www\./, "").split(".")[0];
}

function inferIndustry(text: string): string {
  const normalized = text.toLowerCase();
  const industries: Array<[string, RegExp]> = [
    ["Beauty", /\b(beauty|skincare|cosmetic|makeup|salon)\b/],
    ["Fashion", /\b(fashion|apparel|clothing|style|wear|jewelry)\b/],
    ["Fitness", /\b(fitness|gym|workout|training|nutrition|sports)\b/],
    ["Software", /\b(software|saas|platform|automation|analytics|ai)\b/],
    ["E-commerce", /\b(shop|store|commerce|buy|shipping|product)\b/],
    ["Education", /\b(course|learn|education|school|academy|training)\b/],
    ["Finance", /\b(finance|bank|invest|wealth|payment|insurance)\b/],
    ["Food & Beverage", /\b(food|restaurant|coffee|drink|kitchen|meal)\b/],
    ["Healthcare", /\b(health|clinic|doctor|medical|wellness)\b/],
  ];

  return industries.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "brand_kit"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as {
      websiteUrl?: unknown;
    };
    const url = normalizePublicWebsiteUrl(body.websiteUrl);
    if (!url) {
      return NextResponse.json(
        { error: "Enter a valid public website URL." },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "AdvoraAI Brand Kit Autofill",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return NextResponse.json({ autofill: {} });
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const title =
      extractTag(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      extractTag(html, /<title[^>]*>([^<]+)<\/title>/i);
    const description =
      extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      extractTag(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);

    const autofill: BrandKitAutofill = {
      brandName: title ? cleanTitle(title, url.hostname) : undefined,
      brandDescription: description ? description.slice(0, 500) : undefined,
      industry: inferIndustry(`${title} ${description}`) || undefined,
    };

    return NextResponse.json({ autofill });
  } catch (error) {
    console.warn("Brand Kit autofill failed:", error);
    return NextResponse.json({ autofill: {} });
  }
}
