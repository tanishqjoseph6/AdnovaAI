import {
  extractImportantContent,
  extractMetaDescription,
  extractTitle,
  isExtractedContentUsable,
} from "@/lib/landing-analyzer/extract-content";

const MAX_DOWNLOAD_BYTES = 5_000_000;
const FETCH_TIMEOUT_MS = 20_000;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;

  return false;
}

export function normalizeLandingPageUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter a website URL.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Please enter a valid website URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    isPrivateIpv4(hostname)
  ) {
    throw new Error("This URL cannot be analyzed. Use a public website URL.");
  }

  return url.toString();
}

export type LandingPageContent = {
  url: string;
  title: string;
  metaDescription: string;
  textContent: string;
  needsSummarization: boolean;
};

async function readHtmlWithLimit(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  const limited =
    buffer.byteLength > MAX_DOWNLOAD_BYTES
      ? buffer.slice(0, MAX_DOWNLOAD_BYTES)
      : buffer;

  return new TextDecoder("utf-8", { fatal: false }).decode(limited);
}

export async function fetchLandingPageContent(
  url: string
): Promise<LandingPageContent> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "AdvoraLandingAnalyzer/1.0 (+https://useadvora.com; marketing analysis bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `Could not fetch this page (HTTP ${response.status}). Check the URL and try again.`
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new Error("This URL does not appear to be an HTML landing page.");
    }

    const html = await readHtmlWithLimit(response);
    const title = extractTitle(html);
    const metaDescription = extractMetaDescription(html);
    const extracted = extractImportantContent(html);

    if (!isExtractedContentUsable(extracted.textContent)) {
      throw new Error(
        "Not enough readable content found on this page to analyze."
      );
    }

    return {
      url,
      title,
      metaDescription,
      textContent: extracted.textContent,
      needsSummarization: extracted.needsSummarization,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request timed out. Try again or use a faster site.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch the landing page.");
  } finally {
    clearTimeout(timeout);
  }
}
