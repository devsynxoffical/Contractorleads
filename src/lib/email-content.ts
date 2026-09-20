import * as cheerio from "cheerio";

/**
 * Strips raw HTML, CSS reset stylesheets, MIME quoted-printable artifacts,
 * and formats clean readable text for email previews, conversation threads, and CRM.
 */
export function cleanEmailBody(body: string | null | undefined): string {
  if (!body) return "";

  let text = body;

  // 1. Remove style, script, head tags and their contents first
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");

  // 2. Decode quoted-printable (e.g. =3D -> =, =\r\n -> continuation)
  if (/=[0-9A-Fa-f]{2}|=\r?\n/.test(text)) {
    text = text
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16));
        } catch {
          return "";
        }
      });
  }

  // 3. Remove CSS comments and style rules if present outside tags
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  text = text.replace(/@media[^{]+\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/gi, "");
  text = text.replace(/@import[^;]+;/gi, "");
  text = text.replace(/(?:^|\n)\s*([.#a-zA-Z0-9_-]+(?:,\s*[.#a-zA-Z0-9_-]+)*)\s*\{[^{}]*\}/g, "");
  text = text.replace(/\{[^{}]*\}/g, "");

  // 4. Parse with Cheerio for HTML tags
  if (/<[a-z][\s\S]*>/i.test(text)) {
    try {
      const $ = cheerio.load(text);
      $("style, script, head, meta, link, noscript, svg").remove();
      $("br").replaceWith("\n");
      $("p, div, tr, li, h1, h2, h3, h4, h5, h6").each((_, el) => {
        $(el).append("\n");
      });
      text = $("body").length ? $("body").text() : $.text();
    } catch {
      text = text.replace(/<[^>]+>/g, " ");
    }
  }

  // 5. Clean up multiple empty lines & whitespace
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[\s*#._-]+$/.test(l));

  return lines.join("\n\n").slice(0, 5000).trim();
}

/**
 * Creates a clean single-line snippet for email inbox item previews
 */
export function getEmailPreviewSnippet(body: string | null | undefined, maxLen = 140): string {
  const cleaned = cleanEmailBody(body);
  const singleLine = cleaned.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLen) return singleLine;
  return singleLine.slice(0, maxLen).trim() + "…";
}
