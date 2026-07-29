import PDFDocument from "pdfkit";
import type { AgencyReportBranding } from "@/lib/agency-branding";
import { agencyDisplayName } from "@/lib/agency-branding";

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

/** Layout constants (Letter = 612×792). */
const LEFT = 54;
const RIGHT = 54;
const HEADER_H = 78;
/** Body starts below header chrome */
const BODY_TOP = 100;
/** Reserved band for footer — PDFKit margin keeps content out of this zone */
const FOOTER_H = 44;

function toPdfSafeText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function formatWhen(value: Date | string | null | undefined) {
  const d =
    typeof value === "string"
      ? new Date(value)
      : value instanceof Date
        ? value
        : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString();
  return d.toLocaleDateString(undefined, {
    month: "long",
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
  const kind = sanitizeFilename(title || "intelligence-report") || "report";
  return `${base}-${kind}.pdf`.toLowerCase();
}

function logoBufferFromDataUrl(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl?.startsWith("data:image/")) return null;
  // PDFKit reliably embeds JPEG/PNG; skip unsupported types (e.g. webp)
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

type BrandCtx = {
  agencyName: string;
  accent: string;
  tagline: string;
  website: string | null;
  address: string | null;
  contactBits: string[];
  logo: Buffer | null;
};

/** Draw header with absolute coords; never triggers a page break. */
function paintHeader(doc: PDFKit.PDFDocument, brand: BrandCtx) {
  const pageW = doc.page.width;
  const contentW = pageW - LEFT - RIGHT;

  doc.save();
  doc.rect(0, 0, pageW, HEADER_H).fill(brand.accent);

  let textLeft = LEFT;
  if (brand.logo) {
    try {
      doc.image(brand.logo, LEFT, 14, { fit: [48, 48] });
      textLeft = LEFT + 60;
    } catch {
      /* ignore */
    }
  }

  const textW = Math.max(80, contentW - (textLeft - LEFT));

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(brand.agencyName, textLeft, 18, {
      width: textW,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .fillColor("#ffffff")
    .opacity(0.9)
    .font("Helvetica")
    .fontSize(9)
    .text(brand.tagline, textLeft, 40, {
      width: textW,
      lineBreak: false,
      ellipsis: true,
    });
  doc.opacity(1);

  const meta = [brand.website, brand.address].filter(Boolean).join("  ·  ");
  if (meta) {
    doc
      .fillColor("#ffffff")
      .opacity(0.75)
      .fontSize(8)
      .text(meta, textLeft, 56, {
        width: textW,
        lineBreak: false,
        ellipsis: true,
      });
    doc.opacity(1);
  }
  doc.restore();
}

/** Draw footer with absolute coords; lineBreak:false avoids blank pages. */
function paintFooter(
  doc: PDFKit.PDFDocument,
  brand: BrandCtx,
  businessName: string,
  pageNum: number,
  pageCount: number,
) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const contentW = pageW - LEFT - RIGHT;
  const ruleY = pageH - FOOTER_H + 6;
  const textY = pageH - FOOTER_H + 14;

  doc.save();
  doc
    .strokeColor("#e2e8f0")
    .lineWidth(0.75)
    .moveTo(LEFT, ruleY)
    .lineTo(pageW - RIGHT, ruleY)
    .stroke();

  doc.fillColor("#64748b").font("Helvetica").fontSize(7.5);

  const left = [brand.agencyName, brand.website].filter(Boolean).join("  ·  ");
  const mid = `Confidential · ${businessName}`;
  const right = `Page ${pageNum} of ${pageCount}`;

  doc.text(left, LEFT, textY, {
    width: contentW * 0.36,
    lineBreak: false,
    ellipsis: true,
    align: "left",
  });
  doc.text(mid, LEFT + contentW * 0.36, textY, {
    width: contentW * 0.28,
    lineBreak: false,
    ellipsis: true,
    align: "center",
  });
  doc.text(right, LEFT + contentW * 0.64, textY, {
    width: contentW * 0.36,
    lineBreak: false,
    ellipsis: true,
    align: "right",
  });
  doc.restore();
}

/**
 * Build a branded multi-page PDF from report plain text.
 * Header + correct page footers on every page (no orphan blank pages).
 */
export async function buildLeadReportPdf(
  input: LeadReportPdfInput,
): Promise<Buffer> {
  const brandIn = input.branding ?? null;
  const agencyName =
    agencyDisplayName(brandIn) !== "Your agency"
      ? agencyDisplayName(brandIn)
      : input.agencyName?.trim() || "Contractor Leads";

  const brand: BrandCtx = {
    agencyName,
    accent: brandIn?.reportAccentColor?.trim() || "#3D1078",
    tagline: brandIn?.companyTagline?.trim() || "Lead Intelligence Report",
    website: brandIn?.companyWebsite?.trim() || null,
    address: brandIn?.companyAddress?.trim() || null,
    contactBits: [
      brandIn?.ownerName?.trim() || null,
      brandIn?.ownerEmail?.trim() || brandIn?.email || null,
      brandIn?.ownerPhone?.trim() || null,
    ].filter(Boolean) as string[],
    logo: logoBufferFromDataUrl(brandIn?.companyLogoData),
  };

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
      Title: input.title,
      Author: agencyName,
      Subject: `Intelligence report for ${input.businessName}`,
      Creator: agencyName,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const contentW = doc.page.width - LEFT - RIGHT;

  // Title block
  doc
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(toPdfSafeText(input.title), { width: contentW });

  doc.moveDown(0.35);
  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(9.5)
    .text(
      toPdfSafeText(
        [
          `Prepared for: ${input.businessName}`,
          formatWhen(input.generatedAt),
          `Prepared by: ${agencyName}`,
          input.subtitle || null,
        ]
          .filter(Boolean)
          .join("  ·  "),
      ),
      { width: contentW },
    );

  if (brand.contactBits.length) {
    doc.moveDown(0.2);
    doc
      .fillColor("#64748b")
      .fontSize(8.5)
      .text(`Contact: ${brand.contactBits.join(" · ")}`, { width: contentW });
  }

  doc.moveDown(0.55);
  const ruleY = doc.y;
  doc
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .moveTo(LEFT, ruleY)
    .lineTo(doc.page.width - RIGHT, ruleY)
    .stroke();
  doc.moveDown(0.75);

  // Collapse runs of blank lines so we don't burn vertical space
  // Strip characters PDFKit Helvetica can't encode (keeps Latin-1 safe text)
  const safeContent = toPdfSafeText(
    input.content
      .replace(/\u0000/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u00A0/g, " "),
  );

  const lines = safeContent
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\t/g, "  "));

  let blankRun = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blankRun += 1;
      if (blankRun === 1) doc.moveDown(0.35);
      continue;
    }
    blankRun = 0;

    const trimmed = line.trim();
    const isNumberedHeading = /^\d+\)\s+/.test(trimmed);
    const isHashHeading = /^#{1,3}\s+/.test(trimmed);
    const isAllCapsShort =
      trimmed.length < 70 &&
      /^[A-Z0-9][A-Z0-9\s/&:+-]{8,}$/.test(trimmed);
    const isBullet = /^[-*•]\s+/.test(trimmed);

    if (isNumberedHeading || isHashHeading || isAllCapsShort) {
      doc.moveDown(0.35);
      doc
        .fillColor(brand.accent)
        .font("Helvetica-Bold")
        .fontSize(11.5)
        .text(trimmed.replace(/^#{1,3}\s+/, ""), {
          width: contentW,
          align: "left",
        });
      doc.moveDown(0.12);
      continue;
    }

    if (isBullet) {
      doc
        .fillColor("#0f172a")
        .font("Helvetica")
        .fontSize(10)
        .text(`•  ${trimmed.replace(/^[-*•]\s+/, "")}`, {
          width: contentW,
          align: "left",
          lineGap: 1.5,
        });
      continue;
    }

    doc
      .fillColor("#1e293b")
      .font("Helvetica")
      .fontSize(10)
      .text(line, {
        width: contentW,
        align: "left",
        lineGap: 1.5,
      });
  }

  // Snapshot page count BEFORE chrome — footer/header must not add pages
  const range = doc.bufferedPageRange();
  const total = range.count;

  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    // PDFKit page-breaks when drawing outside margin box. Zero margins
    // only while painting absolute header/footer chrome.
    const saved = { ...doc.page.margins };
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    doc.x = LEFT;
    doc.y = BODY_TOP;
    paintHeader(doc, brand);
    paintFooter(doc, brand, input.businessName, i + 1, total);
    doc.page.margins = saved;
  }

  const after = doc.bufferedPageRange();
  if (after.count !== total) {
    console.warn(
      `[lead-report-pdf] page count changed while painting chrome (${total} → ${after.count})`,
    );
  }

  doc.end();
  return done;
}
