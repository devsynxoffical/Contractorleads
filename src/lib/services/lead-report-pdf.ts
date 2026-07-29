import { createRequire } from "module";
import type { AgencyReportBranding } from "@/lib/agency-branding";
import { agencyDisplayName } from "@/lib/agency-branding";

// Load pdfkit via Node require so AFM font metrics resolve from node_modules
// (Next bundling would break Helvetica.afm paths).
const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit") as typeof import("pdfkit");

export type LeadReportPdfInput = {
  title: string;
  businessName: string;
  content: string;
  subtitle?: string | null;
  generatedAt?: Date | string | null;
  /** @deprecated prefer branding.companyName */
  agencyName?: string | null;
  branding?: AgencyReportBranding | null;
};

const LEFT = 50;
const RIGHT = 50;
const HEADER_H = 68;
const BODY_TOP = 92;
const FOOTER_H = 36;

type Block =
  | { kind: "title"; text: string }
  | { kind: "meta"; label: string; value: string }
  | { kind: "section"; num: string; title: string; body: string[] }
  | { kind: "para"; text: string };

const KNOWN_SECTION_TITLES =
  /^(cover note|what we reviewed|issues we found|why this costs you jobs|how we help|what you get|recommended next step)\b/i;

/** Map Unicode → Helvetica / WinAnsi-safe ASCII. */
function toPdfSafe(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function formatWhen(value: Date | string | null | undefined) {
  const d =
    typeof value === "string"
      ? new Date(value)
      : value instanceof Date
        ? value
        : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sanitizeFilename(name: string) {
  return name
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function reportPdfFilename(businessName: string, title?: string | null) {
  const base = sanitizeFilename(businessName) || "lead-report";
  const kind = sanitizeFilename(title || "client-proposal") || "proposal";
  return `${base}-${kind}.pdf`.toLowerCase();
}

function logoBufferFromDataUrl(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl?.startsWith("data:image/")) return null;
  if (!/^data:image\/(png|jpeg|jpg);base64,/i.test(dataUrl)) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  try {
    const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
    if (buf.length < 32 || buf.length > 900_000) return null;
    return buf;
  } catch {
    return null;
  }
}

function parseMetaLine(text: string): { label: string; value: string } | null {
  const m = text.match(/^([^:]{2,48}):\s+(.+)$/);
  if (!m) return null;
  return { label: m[1].trim(), value: m[2].trim() };
}

/** True only for real proposal sections — not nested "1) Rewrite the homepage…". */
function isMajorSectionHeading(line: string): RegExpMatchArray | null {
  const match = line.match(/^(\d{1,2})\)\s+(.+)$/);
  if (!match) return null;
  const title = match[2].trim();
  if (KNOWN_SECTION_TITLES.test(title)) return match;
  // Short title-case headings only (avoid action sentences)
  if (title.length <= 42 && !/[,.]/.test(title) && /^[A-Z]/.test(title)) {
    const words = title.split(/\s+/);
    if (words.length <= 7) return match;
  }
  return null;
}

function parseReport(content: string): Block[] {
  const lines = toPdfSafe(content).replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const preface: string[] = [];
  while (i < lines.length && !isMajorSectionHeading(lines[i].trim())) {
    const t = lines[i].trim();
    if (t) preface.push(t);
    i += 1;
  }
  if (preface.length) {
    blocks.push({ kind: "title", text: preface[0] });
    for (const line of preface.slice(1)) {
      const parsed = parseMetaLine(line);
      if (parsed) blocks.push({ kind: "meta", ...parsed });
    }
  }

  while (i < lines.length) {
    const line = lines[i].trim();
    const match = isMajorSectionHeading(line);
    if (match) {
      const num = match[1];
      const title = match[2].trim();
      i += 1;
      const body: string[] = [];
      while (i < lines.length && !isMajorSectionHeading(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      while (body.length && !body[body.length - 1].trim()) body.pop();
      blocks.push({ kind: "section", num, title, body });
      continue;
    }
    if (line) blocks.push({ kind: "para", text: line });
    i += 1;
  }

  return blocks;
}

type BrandCtx = {
  agencyName: string;
  accent: string;
  tagline: string;
  website: string | null;
  address: string | null;
  contactBits: string[];
  logo: Buffer | null;
};

function paintHeader(doc: PDFKit.PDFDocument, brand: BrandCtx) {
  const pageW = doc.page.width;

  doc.save();
  doc.rect(0, 0, pageW, HEADER_H).fill(brand.accent);

  let textLeft = LEFT;
  if (brand.logo) {
    try {
      doc.image(brand.logo, LEFT, 12, { fit: [42, 42] });
      textLeft = LEFT + 54;
    } catch {
      /* ignore */
    }
  }

  const textW = Math.max(80, pageW - RIGHT - textLeft);

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(toPdfSafe(brand.agencyName), textLeft, 18, {
      width: textW,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .fillColor("#ffffff")
    .opacity(0.9)
    .font("Helvetica")
    .fontSize(8.5)
    .text(toPdfSafe(brand.tagline), textLeft, 38, {
      width: textW,
      lineBreak: false,
      ellipsis: true,
    });
  doc.opacity(1);

  const meta = [brand.website, brand.address].filter(Boolean).join("  ·  ");
  if (meta) {
    doc
      .fillColor("#ffffff")
      .opacity(0.72)
      .fontSize(7.5)
      .text(toPdfSafe(meta), textLeft, 52, {
        width: textW,
        lineBreak: false,
        ellipsis: true,
      });
    doc.opacity(1);
  }
  doc.restore();
}

function paintFooter(
  doc: PDFKit.PDFDocument,
  brand: BrandCtx,
  businessName: string,
  preparedDate: string,
  pageNum: number,
  pageCount: number,
) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const contentW = pageW - LEFT - RIGHT;
  const textY = pageH - FOOTER_H + 14;

  doc.save();
  doc.fillColor("#94a3b8").font("Helvetica").fontSize(7);

  doc.text(toPdfSafe(`${brand.agencyName}  ·  ${preparedDate}`), LEFT, textY, {
    width: contentW * 0.42,
    lineBreak: false,
    ellipsis: true,
  });
  doc.text(toPdfSafe(`Confidential · ${businessName}`), LEFT + contentW * 0.42, textY, {
    width: contentW * 0.3,
    lineBreak: false,
    ellipsis: true,
    align: "center",
  });
  doc.text(`${pageNum} / ${pageCount}`, LEFT + contentW * 0.72, textY, {
    width: contentW * 0.28,
    lineBreak: false,
    align: "right",
  });
  doc.restore();
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - FOOTER_H - 10;
  if (doc.y + needed > bottom) doc.addPage();
}

function drawSectionBadge(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  num: string,
  accent: string,
) {
  const r = 10;
  doc.save();
  doc.circle(x + r, y + r, r).fill(accent);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(num, x, y + 5, {
      width: r * 2,
      align: "center",
      lineBreak: false,
    });
  doc.restore();
}

function drawBullet(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  accent: string,
) {
  doc.save();
  doc.circle(x + 2.2, y + 4.2, 1.8).fill(accent);
  doc.restore();
}

/** Short channel labels like "Website conversion" — not full sentences. */
function isSubsectionLabel(text: string) {
  if (text.length > 48 || /[.]/.test(text)) return false;
  if (/^\d+[.)]\s+/.test(text) || /^[-*]\s+/.test(text)) return false;
  const words = text.split(/\s+/);
  return words.length >= 1 && words.length <= 6 && /^[A-Z]/.test(text);
}

function writeBodyLines(
  doc: PDFKit.PDFDocument,
  lines: string[],
  contentW: number,
  accent: string,
) {
  for (const raw of lines) {
    const line = toPdfSafe(raw);
    const t = line.trim();
    if (!t) {
      doc.moveDown(0.2);
      continue;
    }

    // Nested steps: "1) …" or "1. …" stay as list items (not section badges)
    const numbered = t.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      ensureSpace(doc, 18);
      const y = doc.y;
      doc
        .fillColor(accent)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`${numbered[1]}.`, LEFT + 8, y, {
          width: 18,
          lineBreak: false,
        });
      doc
        .fillColor("#1e293b")
        .font("Helvetica")
        .fontSize(10)
        .text(numbered[2], LEFT + 28, y, {
          width: contentW - 28,
          lineGap: 2,
        });
      doc.moveDown(0.12);
      continue;
    }

    const bullet = t.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      ensureSpace(doc, 16);
      const y = doc.y;
      drawBullet(doc, LEFT + 8, y + 1, accent);
      doc
        .fillColor("#1e293b")
        .font("Helvetica")
        .fontSize(10)
        .text(bullet[1], LEFT + 20, y, {
          width: contentW - 20,
          lineGap: 2,
        });
      doc.moveDown(0.08);
      continue;
    }

    if (isSubsectionLabel(t)) {
      ensureSpace(doc, 22);
      doc.moveDown(0.25);
      doc
        .fillColor("#0f172a")
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(t, LEFT + 8, doc.y, { width: contentW - 8 });
      doc.moveDown(0.15);
      continue;
    }

    ensureSpace(doc, 16);
    doc
      .fillColor("#334155")
      .font("Helvetica")
      .fontSize(10)
      .text(t, LEFT + 8, doc.y, {
        width: contentW - 8,
        lineGap: 2.5,
      });
    doc.moveDown(0.1);
  }
}

/**
 * Build a branded multi-page PDF from report plain text.
 */
export async function buildLeadReportPdf(
  input: LeadReportPdfInput,
): Promise<Buffer> {
  const brandIn = input.branding ?? null;
  const agencyName =
    agencyDisplayName(brandIn) !== "Your agency"
      ? agencyDisplayName(brandIn)
      : input.agencyName?.trim() || "Contractor Leads";

  const accent = brandIn?.reportAccentColor?.trim() || "#6d28d9";
  const brand: BrandCtx = {
    agencyName: toPdfSafe(agencyName),
    accent,
    tagline: toPdfSafe(
      brandIn?.companyTagline?.trim() || "Client Growth Proposal",
    ),
    website: brandIn?.companyWebsite?.trim()
      ? toPdfSafe(brandIn.companyWebsite.trim())
      : null,
    address: brandIn?.companyAddress?.trim()
      ? toPdfSafe(brandIn.companyAddress.trim())
      : null,
    contactBits: [
      brandIn?.ownerName?.trim() || null,
      brandIn?.ownerEmail?.trim() || brandIn?.email || null,
      brandIn?.ownerPhone?.trim() || null,
    ]
      .filter(Boolean)
      .map((s) => toPdfSafe(s as string)),
    logo: logoBufferFromDataUrl(brandIn?.companyLogoData),
  };

  const preparedDate = formatWhen(input.generatedAt);

  const doc = new PDFDocument({
    size: "LETTER",
    bufferPages: true,
    margins: {
      top: BODY_TOP,
      bottom: FOOTER_H,
      left: LEFT,
      right: RIGHT,
    },
    info: {
      Title: toPdfSafe(input.title),
      Author: brand.agencyName,
      Subject: `Service proposal for ${toPdfSafe(input.businessName)}`,
      Creator: brand.agencyName,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageW = doc.page.width;
  const contentW = pageW - LEFT - RIGHT;
  const blocks = parseReport(input.content);

  // --- Title ---
  doc
    .fillColor(accent)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("CLIENT PROPOSAL", LEFT, doc.y, {
      width: contentW,
      characterSpacing: 1.4,
    });

  doc.moveDown(0.4);
  const displayTitle = toPdfSafe(
    input.title.includes(input.businessName)
      ? input.title
      : `${input.title} - ${input.businessName}`,
  );
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(displayTitle, { width: contentW, lineGap: 2 });

  doc.moveDown(0.2);
  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(9.5)
    .text(
      toPdfSafe(
        [
          input.subtitle?.trim() || null,
          `Prepared ${preparedDate}`,
        ]
          .filter(Boolean)
          .join("  ·  "),
      ),
      { width: contentW },
    );

  // --- Compact 2-column info grid (no purple bar, no DATE row) ---
  const metaFromContent = blocks.filter(
    (b): b is Extract<Block, { kind: "meta" }> => b.kind === "meta",
  );

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Client", value: toPdfSafe(input.businessName) },
    { label: "Prepared by", value: brand.agencyName },
  ];

  if (brand.contactBits[0] || brand.contactBits[1] || brand.contactBits[2]) {
    metaRows.push({
      label: "Contact",
      value: brand.contactBits.filter(Boolean).join("  ·  "),
    });
  }

  for (const m of metaFromContent) {
    const key = m.label.toLowerCase();
    if (key.includes("date") || key.includes("prepared")) continue;
    if (
      key.includes("website") ||
      key.includes("location") ||
      key.includes("reviewed")
    ) {
      if (!metaRows.some((r) => r.label.toLowerCase() === key)) {
        metaRows.push({
          label: key.includes("website") ? "Website" : m.label,
          value: m.value,
        });
      }
    }
  }

  doc.moveDown(0.65);
  const cardTop = doc.y;
  const pad = 12;
  const gap = 14;
  const colW = (contentW - gap) / 2;

  // Measure two-column heights with wrapping
  const cellHeights = metaRows.map((row) => {
    doc.font("Helvetica-Bold").fontSize(7);
    const labelH = 9;
    doc.font("Helvetica").fontSize(9);
    const valueH = doc.heightOfString(row.value, { width: colW - 4 });
    return labelH + 2 + valueH + 8;
  });

  let leftH = pad;
  let rightH = pad;
  metaRows.forEach((_, idx) => {
    if (idx % 2 === 0) leftH += cellHeights[idx];
    else rightH += cellHeights[idx];
  });
  const cardH = Math.max(leftH, rightH) + pad;

  ensureSpace(doc, cardH + 10);
  doc.save();
  doc.roundedRect(LEFT, cardTop, contentW, cardH, 6).fill("#f8fafc");
  doc
    .roundedRect(LEFT, cardTop, contentW, cardH, 6)
    .lineWidth(0.6)
    .strokeColor("#e2e8f0")
    .stroke();
  doc.restore();

  let yLeft = cardTop + pad;
  let yRight = cardTop + pad;
  metaRows.forEach((row, idx) => {
    const col = idx % 2;
    const x = LEFT + pad + col * (colW + gap);
    let y = col === 0 ? yLeft : yRight;
    doc
      .fillColor("#94a3b8")
      .font("Helvetica-Bold")
      .fontSize(7)
      .text(row.label.toUpperCase(), x, y, {
        width: colW - 4,
        lineBreak: false,
        characterSpacing: 0.4,
      });
    y += 11;
    doc
      .fillColor("#0f172a")
      .font("Helvetica")
      .fontSize(9)
      .text(row.value, x, y, { width: colW - 4 });
    y = doc.y + 8;
    if (col === 0) yLeft = y;
    else yRight = y;
  });

  doc.y = cardTop + cardH + 16;

  // --- Body ---
  const bodyBlocks = blocks.filter(
    (b) => b.kind === "section" || b.kind === "para",
  );

  if (!bodyBlocks.length) {
    writeBodyLines(
      doc,
      toPdfSafe(input.content).replace(/\r\n/g, "\n").split("\n"),
      contentW,
      accent,
    );
  }

  for (const block of bodyBlocks) {
    if (block.kind === "para") {
      ensureSpace(doc, 18);
      doc
        .fillColor("#334155")
        .font("Helvetica")
        .fontSize(10)
        .text(block.text, { width: contentW, lineGap: 2.5 });
      doc.moveDown(0.3);
      continue;
    }

    ensureSpace(doc, 34);
    doc.moveDown(0.4);
    const y = doc.y;
    drawSectionBadge(doc, LEFT, y, block.num, accent);
    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(block.title, LEFT + 28, y + 3, {
        width: contentW - 28,
        lineBreak: false,
        ellipsis: true,
      });
    doc.y = y + 24;
    writeBodyLines(doc, block.body, contentW, accent);
  }

  // Closing note (no heavy bar if near bottom — keep compact)
  ensureSpace(doc, 36);
  doc.moveDown(0.7);
  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      toPdfSafe(
        `Prepared by ${brand.agencyName} for ${input.businessName}. This proposal is confidential.`,
      ),
      { width: contentW, align: "left" },
    );

  const range = doc.bufferedPageRange();
  const total = range.count;

  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    const saved = { ...doc.page.margins };
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    doc.x = LEFT;
    doc.y = BODY_TOP;
    paintHeader(doc, brand);
    paintFooter(
      doc,
      brand,
      toPdfSafe(input.businessName),
      preparedDate,
      i + 1,
      total,
    );
    doc.page.margins = saved;
  }

  doc.end();
  return done;
}
