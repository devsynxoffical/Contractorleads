import ExcelJS from "exceljs";

export type ParsedLead = {
  email: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
};

export type ParseSheetResult = {
  leads: ParsedLead[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidEmailCount: number;
  headers: string[];
  detectedColumns: {
    emailCol?: string;
    businessNameCol?: string;
    ownerNameCol?: string;
    phoneCol?: string;
    cityCol?: string;
    stateCol?: string;
    countryCol?: string;
    websiteCol?: string;
  };
};

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val).trim();
  if (val instanceof Date) return val.toISOString().split("T")[0];
  if (typeof val === "object") {
    const obj = val as Record<string, any>;
    if (Array.isArray(obj.richText)) {
      return obj.richText.map((rt: any) => safeStr(rt?.text)).join("").trim();
    }
    if (obj.text !== undefined) return safeStr(obj.text);
    if (obj.result !== undefined) return safeStr(obj.result);
    if (obj.hyperlink !== undefined) return safeStr(obj.text || obj.hyperlink);
    return "";
  }
  return String(val).trim();
}

function normalizeHeader(h: unknown): string {
  return safeStr(h).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function guessColumnMapping(headers: string[]) {
  const map: ParseSheetResult["detectedColumns"] = {};

  for (const h of headers) {
    if (!h || typeof h !== "string") continue;
    const clean = normalizeHeader(h);
    if (!clean) continue;

    if (!map.emailCol && /^(email|mail|emailaddress|contactemail|directemail|decisionmakeremail|workemail|primaryemail)$/.test(clean)) {
      map.emailCol = h;
    } else if (!map.emailCol && clean.includes("email")) {
      map.emailCol = h;
    } else if (!map.businessNameCol && /^(businessname|companyname|company|business|contractor|account|name|agency|organization|firm)$/.test(clean)) {
      map.businessNameCol = h;
    } else if (!map.businessNameCol && (clean.includes("company") || clean.includes("business"))) {
      map.businessNameCol = h;
    } else if (!map.ownerNameCol && /^(ownername|contactname|owner|contact|fullname|firstname|person|decisionmaker|leadname|executive|prospectname)$/.test(clean)) {
      map.ownerNameCol = h;
    } else if (!map.ownerNameCol && (clean.includes("owner") || clean.includes("contact") || clean.includes("person") || clean.includes("full_name"))) {
      map.ownerNameCol = h;
    } else if (!map.phoneCol && /^(phone|phonenumber|mobile|cell|directphone|telephone|tel|phone1)$/.test(clean)) {
      map.phoneCol = h;
    } else if (!map.phoneCol && clean.includes("phone")) {
      map.phoneCol = h;
    } else if (!map.cityCol && /^(city|town|metro|municipality)$/.test(clean)) {
      map.cityCol = h;
    } else if (!map.stateCol && /^(state|province|region|st)$/.test(clean)) {
      map.stateCol = h;
    } else if (!map.countryCol && /^(country|nation|cntry)$/.test(clean)) {
      map.countryCol = h;
    } else if (!map.websiteCol && /^(website|domain|url|site|web|webaddress)$/.test(clean)) {
      map.websiteCol = h;
    }
  }

  return map;
}

/**
 * Parses raw text (CSV, TSV, comma/tab separated lines).
 */
export function parseSpreadsheetText(rawText: string): ParseSheetResult {
  if (!rawText || typeof rawText !== "string") {
    return {
      leads: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidEmailCount: 0,
      headers: [],
      detectedColumns: {},
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => safeStr(l))
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      leads: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidEmailCount: 0,
      headers: [],
      detectedColumns: {},
    };
  }

  // Detect delimiter: comma, tab, semicolon, pipe
  const firstLine = lines[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
  else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
  else if (pipeCount > commaCount && pipeCount > tabCount) delimiter = "|";

  // Split line considering quotes
  const splitLine = (line: string): string[] => {
    if (!line) return [];
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(safeStr(current.replace(/^['"]+|['"]+$/g, "")));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(safeStr(current.replace(/^['"]+|['"]+$/g, "")));
    return result;
  };

  const rawHeaderCols = splitLine(lines[0]);
  const hasHeader = rawHeaderCols.some((c) =>
    /email|name|company|phone|city|state|lead|business/i.test(safeStr(c))
  );

  let headers: string[] = [];
  let rowStartIndex = 0;

  if (hasHeader) {
    headers = rawHeaderCols.map((c, i) => safeStr(c) || `Column ${i + 1}`);
    rowStartIndex = 1;
  } else {
    headers = rawHeaderCols.map((_, i) => `Column ${i + 1}`);
    rowStartIndex = 0;
  }

  const mapping = guessColumnMapping(headers);

  const leads: ParsedLead[] = [];
  const seenEmails = new Set<string>();
  let duplicateCount = 0;
  let invalidEmailCount = 0;

  for (let i = rowStartIndex; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (!cols.length || cols.every((c) => !safeStr(c))) continue;

    let email = "";
    let businessName = "";
    let ownerName = "";
    let phone = "";
    let city = "";
    let state = "";
    let country = "US";
    let website = "";

    if (mapping.emailCol) {
      const idx = headers.indexOf(mapping.emailCol);
      if (idx !== -1 && cols[idx]) email = safeStr(cols[idx]);
    }
    if (mapping.businessNameCol) {
      const idx = headers.indexOf(mapping.businessNameCol);
      if (idx !== -1 && cols[idx]) businessName = safeStr(cols[idx]);
    }
    if (mapping.ownerNameCol) {
      const idx = headers.indexOf(mapping.ownerNameCol);
      if (idx !== -1 && cols[idx]) ownerName = safeStr(cols[idx]);
    }
    if (mapping.phoneCol) {
      const idx = headers.indexOf(mapping.phoneCol);
      if (idx !== -1 && cols[idx]) phone = safeStr(cols[idx]);
    }
    if (mapping.cityCol) {
      const idx = headers.indexOf(mapping.cityCol);
      if (idx !== -1 && cols[idx]) city = safeStr(cols[idx]);
    }
    if (mapping.stateCol) {
      const idx = headers.indexOf(mapping.stateCol);
      if (idx !== -1 && cols[idx]) state = safeStr(cols[idx]);
    }
    if (mapping.countryCol) {
      const idx = headers.indexOf(mapping.countryCol);
      if (idx !== -1 && cols[idx]) country = safeStr(cols[idx]);
    }
    if (mapping.websiteCol) {
      const idx = headers.indexOf(mapping.websiteCol);
      if (idx !== -1 && cols[idx]) website = safeStr(cols[idx]);
    }

    // Fallback search across row cells if email wasn't mapped
    if (!email) {
      const foundEmail = cols.find((c) => {
        const s = safeStr(c);
        return s && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(s);
      });
      if (foundEmail) email = safeStr(foundEmail);
    }

    // Fallback for businessName
    if (!businessName) {
      const nonEmailNonPhone = cols.find((c) => {
        const s = safeStr(c);
        return s && s !== email && !/^\+?[0-9\s().-]{7,}$/.test(s) && s.length > 1;
      });
      if (nonEmailNonPhone) {
        businessName = safeStr(nonEmailNonPhone);
      } else if (email) {
        const domain = email.split("@")[1] || "";
        businessName = domain.split(".")[0]?.toUpperCase() || "Contractor Lead";
      }
    }

    const cleanEmail = safeStr(email).toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      invalidEmailCount++;
      continue;
    }

    if (seenEmails.has(cleanEmail)) {
      duplicateCount++;
      continue;
    }

    seenEmails.add(cleanEmail);

    leads.push({
      email: cleanEmail,
      businessName: safeStr(businessName) || cleanEmail.split("@")[0],
      ownerName: safeStr(ownerName) || undefined,
      phone: safeStr(phone) || undefined,
      city: safeStr(city) || undefined,
      state: safeStr(state) || undefined,
      country: safeStr(country) || "US",
      website: safeStr(website) || undefined,
    });
  }

  return {
    leads,
    totalRows: Math.max(0, lines.length - rowStartIndex),
    validCount: leads.length,
    duplicateCount,
    invalidEmailCount,
    headers,
    detectedColumns: mapping,
  };
}

/**
 * Parses an Excel binary Buffer / ArrayBuffer (.xlsx / .xls).
 */
export async function parseExcelBuffer(buffer: ArrayBuffer | Buffer): Promise<ParseSheetResult> {
  const workbook = new ExcelJS.Workbook();
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await workbook.xlsx.load(nodeBuf as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return {
      leads: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidEmailCount: 0,
      headers: [],
      detectedColumns: {},
    };
  }

  const rawRows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues = (row.values as unknown[]);
    if (!rowValues || !Array.isArray(rowValues)) return;
    // exceljs row.values is 1-indexed, so index 0 is undefined
    const items = rowValues.slice(1).map((val) => safeStr(val));
    if (items.some((it) => Boolean(it))) {
      rawRows.push(items);
    }
  });

  if (rawRows.length === 0) {
    return {
      leads: [],
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidEmailCount: 0,
      headers: [],
      detectedColumns: {},
    };
  }

  const rawHeaderCols = rawRows[0] || [];
  const hasHeader = rawHeaderCols.some((c) =>
    /email|name|company|phone|city|state|lead|business/i.test(safeStr(c))
  );

  const headers = hasHeader
    ? rawHeaderCols.map((c, i) => safeStr(c) || `Column ${i + 1}`)
    : rawHeaderCols.map((_, i) => `Column ${i + 1}`);

  const rowStartIndex = hasHeader ? 1 : 0;
  const mapping = guessColumnMapping(headers);

  const leads: ParsedLead[] = [];
  const seenEmails = new Set<string>();
  let duplicateCount = 0;
  let invalidEmailCount = 0;

  for (let i = rowStartIndex; i < rawRows.length; i++) {
    const cols = (rawRows[i] || []).map((c) => safeStr(c));
    if (!cols.length || cols.every((c) => !c)) continue;

    let email = "";
    let businessName = "";
    let ownerName = "";
    let phone = "";
    let city = "";
    let state = "";
    let country = "US";
    let website = "";

    if (mapping.emailCol) {
      const idx = headers.indexOf(mapping.emailCol);
      if (idx !== -1 && cols[idx]) email = safeStr(cols[idx]);
    }
    if (mapping.businessNameCol) {
      const idx = headers.indexOf(mapping.businessNameCol);
      if (idx !== -1 && cols[idx]) businessName = safeStr(cols[idx]);
    }
    if (mapping.ownerNameCol) {
      const idx = headers.indexOf(mapping.ownerNameCol);
      if (idx !== -1 && cols[idx]) ownerName = safeStr(cols[idx]);
    }
    if (mapping.phoneCol) {
      const idx = headers.indexOf(mapping.phoneCol);
      if (idx !== -1 && cols[idx]) phone = safeStr(cols[idx]);
    }
    if (mapping.cityCol) {
      const idx = headers.indexOf(mapping.cityCol);
      if (idx !== -1 && cols[idx]) city = safeStr(cols[idx]);
    }
    if (mapping.stateCol) {
      const idx = headers.indexOf(mapping.stateCol);
      if (idx !== -1 && cols[idx]) state = safeStr(cols[idx]);
    }
    if (mapping.countryCol) {
      const idx = headers.indexOf(mapping.countryCol);
      if (idx !== -1 && cols[idx]) country = safeStr(cols[idx]);
    }
    if (mapping.websiteCol) {
      const idx = headers.indexOf(mapping.websiteCol);
      if (idx !== -1 && cols[idx]) website = safeStr(cols[idx]);
    }

    if (!email) {
      const foundEmail = cols.find((c) => {
        const s = safeStr(c);
        return s && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(s);
      });
      if (foundEmail) email = safeStr(foundEmail);
    }

    if (!businessName) {
      const nonEmailNonPhone = cols.find((c) => {
        const s = safeStr(c);
        return s && s !== email && !/^\+?[0-9\s().-]{7,}$/.test(s) && s.length > 1;
      });
      if (nonEmailNonPhone) {
        businessName = safeStr(nonEmailNonPhone);
      } else if (email) {
        const domain = email.split("@")[1] || "";
        businessName = domain.split(".")[0]?.toUpperCase() || "Contractor Lead";
      }
    }

    const cleanEmail = safeStr(email).toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      invalidEmailCount++;
      continue;
    }

    if (seenEmails.has(cleanEmail)) {
      duplicateCount++;
      continue;
    }

    seenEmails.add(cleanEmail);

    leads.push({
      email: cleanEmail,
      businessName: safeStr(businessName) || cleanEmail.split("@")[0],
      ownerName: safeStr(ownerName) || undefined,
      phone: safeStr(phone) || undefined,
      city: safeStr(city) || undefined,
      state: safeStr(state) || undefined,
      country: safeStr(country) || "US",
      website: safeStr(website) || undefined,
    });
  }

  return {
    leads,
    totalRows: Math.max(0, rawRows.length - rowStartIndex),
    validCount: leads.length,
    duplicateCount,
    invalidEmailCount,
    headers,
    detectedColumns: mapping,
  };
}
