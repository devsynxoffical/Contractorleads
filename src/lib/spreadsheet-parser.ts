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

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function guessColumnMapping(headers: string[]) {
  const map: ParseSheetResult["detectedColumns"] = {};

  for (const h of headers) {
    const clean = normalizeHeader(h);
    if (!map.emailCol && /^(email|mail|emailaddress|contactemail|directemail|decisionmakeremail)$/.test(clean)) {
      map.emailCol = h;
    } else if (!map.emailCol && clean.includes("email")) {
      map.emailCol = h;
    } else if (!map.businessNameCol && /^(businessname|companyname|company|business|contractor|account|name)$/.test(clean)) {
      map.businessNameCol = h;
    } else if (!map.businessNameCol && (clean.includes("company") || clean.includes("business"))) {
      map.businessNameCol = h;
    } else if (!map.ownerNameCol && /^(ownername|contactname|owner|contact|fullname|firstname|person|decisionmaker|leadname|executive)$/.test(clean)) {
      map.ownerNameCol = h;
    } else if (!map.ownerNameCol && (clean.includes("owner") || clean.includes("contact") || clean.includes("person"))) {
      map.ownerNameCol = h;
    } else if (!map.phoneCol && /^(phone|phonenumber|mobile|cell|directphone|telephone|tel)$/.test(clean)) {
      map.phoneCol = h;
    } else if (!map.phoneCol && clean.includes("phone")) {
      map.phoneCol = h;
    } else if (!map.cityCol && /^(city|town|metro|municipality)$/.test(clean)) {
      map.cityCol = h;
    } else if (!map.stateCol && /^(state|province|region|st)$/.test(clean)) {
      map.stateCol = h;
    } else if (!map.countryCol && /^(country|nation|cntry)$/.test(clean)) {
      map.countryCol = h;
    } else if (!map.websiteCol && /^(website|domain|url|site|web)$/.test(clean)) {
      map.websiteCol = h;
    }
  }

  return map;
}

/**
 * Parses raw text (CSV, TSV, comma/tab separated lines).
 */
export function parseSpreadsheetText(rawText: string): ParseSheetResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
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
  const firstLine = lines[0];
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
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^['"]+|['"]+$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^['"]+|['"]+$/g, ""));
    return result;
  };

  const rawHeaderCols = splitLine(lines[0]);
  const hasHeader = rawHeaderCols.some((c) =>
    /email|name|company|phone|city|state|lead|business/i.test(c)
  );

  let headers: string[] = [];
  let rowStartIndex = 0;

  if (hasHeader) {
    headers = rawHeaderCols;
    rowStartIndex = 1;
  } else {
    // Generate col1, col2, etc.
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
      if (idx !== -1 && cols[idx]) email = cols[idx];
    }
    if (mapping.businessNameCol) {
      const idx = headers.indexOf(mapping.businessNameCol);
      if (idx !== -1 && cols[idx]) businessName = cols[idx];
    }
    if (mapping.ownerNameCol) {
      const idx = headers.indexOf(mapping.ownerNameCol);
      if (idx !== -1 && cols[idx]) ownerName = cols[idx];
    }
    if (mapping.phoneCol) {
      const idx = headers.indexOf(mapping.phoneCol);
      if (idx !== -1 && cols[idx]) phone = cols[idx];
    }
    if (mapping.cityCol) {
      const idx = headers.indexOf(mapping.cityCol);
      if (idx !== -1 && cols[idx]) city = cols[idx];
    }
    if (mapping.stateCol) {
      const idx = headers.indexOf(mapping.stateCol);
      if (idx !== -1 && cols[idx]) state = cols[idx];
    }
    if (mapping.countryCol) {
      const idx = headers.indexOf(mapping.countryCol);
      if (idx !== -1 && cols[idx]) country = cols[idx];
    }
    if (mapping.websiteCol) {
      const idx = headers.indexOf(mapping.websiteCol);
      if (idx !== -1 && cols[idx]) website = cols[idx];
    }

    // Fallback search across row cells if email wasn't mapped
    if (!email) {
      const foundEmail = cols.find((c) =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(c.trim())
      );
      if (foundEmail) email = foundEmail;
    }

    // Fallback for businessName
    if (!businessName) {
      const nonEmailNonPhone = cols.find(
        (c) => c !== email && !/^\+?[0-9\s().-]{7,}$/.test(c) && c.length > 1
      );
      if (nonEmailNonPhone) {
        businessName = nonEmailNonPhone;
      } else if (email) {
        // Derivation from email domain
        const domain = email.split("@")[1] || "";
        businessName = domain.split(".")[0]?.toUpperCase() || "Contractor Lead";
      }
    }

    const cleanEmail = email.trim().toLowerCase();
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
      businessName: businessName.trim() || cleanEmail.split("@")[0],
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || "US",
      website: website.trim() || undefined,
    });
  }

  return {
    leads,
    totalRows: lines.length - rowStartIndex,
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
    // exceljs row.values is 1-indexed, so index 0 is undefined
    const items = rowValues.slice(1).map((val) => {
      if (val === null || val === undefined) return "";
      if (typeof val === "object" && "text" in (val as any)) return String((val as any).text);
      if (typeof val === "object" && "result" in (val as any)) return String((val as any).result);
      return String(val);
    });
    rawRows.push(items);
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

  const rawHeaderCols = rawRows[0];
  const hasHeader = rawHeaderCols.some((c) =>
    /email|name|company|phone|city|state|lead|business/i.test(c)
  );

  const headers = hasHeader ? rawHeaderCols : rawHeaderCols.map((_, i) => `Column ${i + 1}`);
  const rowStartIndex = hasHeader ? 1 : 0;
  const mapping = guessColumnMapping(headers);

  const leads: ParsedLead[] = [];
  const seenEmails = new Set<string>();
  let duplicateCount = 0;
  let invalidEmailCount = 0;

  for (let i = rowStartIndex; i < rawRows.length; i++) {
    const cols = rawRows[i];
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
      if (idx !== -1 && cols[idx]) email = cols[idx];
    }
    if (mapping.businessNameCol) {
      const idx = headers.indexOf(mapping.businessNameCol);
      if (idx !== -1 && cols[idx]) businessName = cols[idx];
    }
    if (mapping.ownerNameCol) {
      const idx = headers.indexOf(mapping.ownerNameCol);
      if (idx !== -1 && cols[idx]) ownerName = cols[idx];
    }
    if (mapping.phoneCol) {
      const idx = headers.indexOf(mapping.phoneCol);
      if (idx !== -1 && cols[idx]) phone = cols[idx];
    }
    if (mapping.cityCol) {
      const idx = headers.indexOf(mapping.cityCol);
      if (idx !== -1 && cols[idx]) city = cols[idx];
    }
    if (mapping.stateCol) {
      const idx = headers.indexOf(mapping.stateCol);
      if (idx !== -1 && cols[idx]) state = cols[idx];
    }
    if (mapping.countryCol) {
      const idx = headers.indexOf(mapping.countryCol);
      if (idx !== -1 && cols[idx]) country = cols[idx];
    }
    if (mapping.websiteCol) {
      const idx = headers.indexOf(mapping.websiteCol);
      if (idx !== -1 && cols[idx]) website = cols[idx];
    }

    if (!email) {
      const foundEmail = cols.find((c) =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(c.trim())
      );
      if (foundEmail) email = foundEmail;
    }

    if (!businessName) {
      const nonEmailNonPhone = cols.find(
        (c) => c !== email && !/^\+?[0-9\s().-]{7,}$/.test(c) && c.length > 1
      );
      if (nonEmailNonPhone) {
        businessName = nonEmailNonPhone;
      } else if (email) {
        const domain = email.split("@")[1] || "";
        businessName = domain.split(".")[0]?.toUpperCase() || "Contractor Lead";
      }
    }

    const cleanEmail = email.trim().toLowerCase();
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
      businessName: businessName.trim() || cleanEmail.split("@")[0],
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || "US",
      website: website.trim() || undefined,
    });
  }

  return {
    leads,
    totalRows: rawRows.length - rowStartIndex,
    validCount: leads.length,
    duplicateCount,
    invalidEmailCount,
    headers,
    detectedColumns: mapping,
  };
}
