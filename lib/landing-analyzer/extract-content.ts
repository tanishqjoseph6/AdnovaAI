const MIN_EXTRACTED_LENGTH = 80;
export const TARGET_TEXT_LENGTH = 12_000;
export const MAX_TEXT_LENGTH = 15_000;

export type ExtractedPageSections = {
  headings: string;
  hero: string;
  ctas: string;
  pricing: string;
  testimonials: string;
  faq: string;
  footerTrust: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    )
    .replace(/&[a-z]+;/gi, " ");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h1|h2|h3|h4|tr|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueLines(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = normalizeWhitespace(item);
    if (!normalized || normalized.length < 2) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<picture[\s\S]*?<\/picture>/gi, " ")
    .replace(/<source[\s\S]*?>/gi, " ")
    .replace(/<link[\s\S]*?>/gi, " ")
    .replace(/<img[\s\S]*?>/gi, " ")
    .replace(/<video[\s\S]*?<\/video>/gi, " ")
    .replace(/<audio[\s\S]*?<\/audio>/gi, " ")
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, " ")
    .replace(/<[^>]*\bhidden\b[^>]*>[\s\S]*?<\/[^>]+>/gi, " ")
    .replace(/<[^>]*aria-hidden=["']true["'][^>]*>[\s\S]*?<\/[^>]+>/gi, " ");
}

function extractMatches(html: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const text = stripTags(match[1] ?? match[0] ?? "");
    if (text) {
      results.push(text);
    }
  }

  return results;
}

function truncateHeading(text: string): string {
  return truncateText(text, 500);
}

function extractSectionBlocks(
  html: string,
  keywords: string[]
): string[] {
  const blocks: string[] = [];
  const tagPattern =
    /<(section|div|article|aside|footer|header|main|ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;

  for (const match of html.matchAll(tagPattern)) {
    const block = match[0];
    const openingTag = match[0].slice(0, 200).toLowerCase();
    const hasKeyword = keywords.some((keyword) =>
      openingTag.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      const text = stripTags(block);
      if (text.length >= 20) {
        blocks.push(text);
      }
    }
  }

  return blocks;
}

export function extractHeadings(html: string): string {
  const headings = uniqueLines([
    ...extractMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(truncateHeading),
    ...extractMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map(truncateHeading),
    ...extractMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi).map(truncateHeading),
  ]).slice(0, 25);

  return headings.join("\n");
}

export function extractHeroSection(html: string): string {
  const heroBlocks = uniqueLines([
    ...extractSectionBlocks(html, ["hero", "banner", "jumbotron", "above-fold"]),
    ...extractMatches(html, /<header[^>]*>([\s\S]*?)<\/header>/gi),
    ...extractMatches(html, /<main[^>]*>([\s\S]{0,4000})/gi),
  ]);

  if (heroBlocks.length > 0) {
    return truncateText(heroBlocks.join("\n"), 6_000);
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return truncateText(stripTags(bodyMatch?.[1] ?? html), 4_000);
}

export function extractCtaButtons(html: string): string {
  const ctas = uniqueLines([
    ...extractMatches(html, /<button[^>]*>([\s\S]*?)<\/button>/gi),
    ...extractMatches(
      html,
      /<a[^>]*(?:class|role)=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi
    ),
    ...extractMatches(
      html,
      /<a[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi
    ).filter((text) => text.length <= 80),
    ...extractMatches(html, /<input[^>]*type=["'](?:submit|button)["'][^>]*value=["']([^"']+)["'][^>]*>/gi),
  ]).slice(0, 30);

  return ctas.join("\n");
}

export function extractPricingSection(html: string): string {
  const pricing = uniqueLines([
    ...extractSectionBlocks(html, [
      "pricing",
      "price",
      "plan",
      "plans",
      "subscription",
    ]),
    ...extractMatches(html, /<h[2-3][^>]*>([^<]*(?:price|plan|pricing)[^<]*)<\/h[2-3]>/gi),
  ]).slice(0, 8);

  return truncateText(pricing.join("\n"), 4_000);
}

export function extractTestimonials(html: string): string {
  const testimonials = uniqueLines([
    ...extractSectionBlocks(html, [
      "testimonial",
      "review",
      "social-proof",
      "customers",
      "quotes",
    ]),
    ...extractMatches(html, /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi),
  ]).slice(0, 12);

  return truncateText(testimonials.join("\n"), 4_000);
}

export function extractFaqSection(html: string): string {
  const faqItems = uniqueLines([
    ...extractSectionBlocks(html, ["faq", "questions", "accordion"]),
  ]).slice(0, 20);

  const detailsPairs: string[] = [];
  for (const match of html.matchAll(
    /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi
  )) {
    const question = stripTags(match[1] ?? "");
    const answer = truncateText(stripTags(match[2] ?? ""), 300);
    if (question) {
      detailsPairs.push(`${question}: ${answer}`);
    }
  }

  for (const match of html.matchAll(
    /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi
  )) {
    const question = stripTags(match[1] ?? "");
    const answer = truncateText(stripTags(match[2] ?? ""), 300);
    if (question) {
      detailsPairs.push(`${question}: ${answer}`);
    }
  }

  return truncateText(
    uniqueLines([...faqItems, ...detailsPairs]).join("\n"),
    4_000
  );
}

export function extractFooterTrustSignals(html: string): string {
  const footerBlocks = extractMatches(html, /<footer[^>]*>([\s\S]*?)<\/footer>/gi);
  const footerText = truncateText(footerBlocks.join("\n"), 2_000);

  const trustKeywords = uniqueLines([
    ...extractSectionBlocks(html, [
      "trust",
      "security",
      "badge",
      "certified",
      "compliance",
      "partner",
      "logo",
    ]),
    ...extractMatches(
      html,
      /<(?:span|p|div|li)[^>]*>([^<]{0,120}(?:ISO|SOC|GDPR|SSL|secure|trusted|million|customers|award)[^<]*)<\/(?:span|p|div|li)>/gi
    ),
  ]).slice(0, 15);

  return truncateText(
    uniqueLines([footerText, ...trustKeywords].filter(Boolean)).join("\n"),
    4_000
  );
}

export function extractImportantSections(html: string): ExtractedPageSections {
  const cleaned = sanitizeHtml(html);

  return {
    headings: extractHeadings(cleaned),
    hero: extractHeroSection(cleaned),
    ctas: extractCtaButtons(cleaned),
    pricing: extractPricingSection(cleaned),
    testimonials: extractTestimonials(cleaned),
    faq: extractFaqSection(cleaned),
    footerTrust: extractFooterTrustSignals(cleaned),
  };
}

function assembleSections(sections: ExtractedPageSections): string {
  const parts: string[] = [];

  const append = (label: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      parts.push(`[${label}]\n${trimmed}`);
    }
  };

  append("Headings (H1-H3)", sections.headings);
  append("Hero section", sections.hero);
  append("CTA buttons and links", sections.ctas);
  append("Pricing section", sections.pricing);
  append("Testimonials and reviews", sections.testimonials);
  append("FAQ", sections.faq);
  append("Footer and trust signals", sections.footerTrust);

  return parts.join("\n\n");
}

function applySectionBudgets(
  sections: ExtractedPageSections
): ExtractedPageSections {
  return {
    headings: truncateText(sections.headings, 1_500),
    hero: truncateText(sections.hero, 3_500),
    ctas: truncateText(sections.ctas, 1_500),
    pricing: truncateText(sections.pricing, 2_000),
    testimonials: truncateText(sections.testimonials, 2_000),
    faq: truncateText(sections.faq, 2_000),
    footerTrust: truncateText(sections.footerTrust, 2_500),
  };
}

export type ExtractedContentResult = {
  textContent: string;
  needsSummarization: boolean;
};

export function extractImportantContent(html: string): ExtractedContentResult {
  const sections = extractImportantSections(html);
  const hasSignal = Object.values(sections).some(
    (section) => section.trim().length >= 20
  );

  if (!hasSignal) {
    const fallback = truncateText(stripTags(sanitizeHtml(html)), MAX_TEXT_LENGTH);
    return {
      textContent: fallback,
      needsSummarization: false,
    };
  }

  const rawAssembled = assembleSections(sections);

  if (rawAssembled.length > MAX_TEXT_LENGTH) {
    return {
      textContent: truncateText(rawAssembled, 30_000),
      needsSummarization: true,
    };
  }

  const budgeted = assembleSections(applySectionBudgets(sections));

  return {
    textContent: truncateText(budgeted, MAX_TEXT_LENGTH),
    needsSummarization: false,
  };
}

export function isExtractedContentUsable(text: string): boolean {
  return normalizeWhitespace(text).length >= MIN_EXTRACTED_LENGTH;
}

export function shouldSummarizeContent(text: string): boolean {
  return text.length > MAX_TEXT_LENGTH;
}

export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) {
    return "";
  }

  return normalizeWhitespace(stripTags(match[1]));
}

export function extractMetaDescription(html: string): string {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) {
      return normalizeWhitespace(decodeHtmlEntities(match[1]));
    }
  }

  return "";
}
