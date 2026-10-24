/**
 * Spintax Node Types
 */
export type SpintaxNode =
  | { type: "text"; value: string }
  | { type: "spin"; options: SpintaxNode[][]; raw: string }
  | { type: "var"; name: string; fallback?: string };

export type SpintaxValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  blockCount: number;
  uniqueCombinations: number;
  characterCounts: { min: number; max: number; avg: number };
  spamScore: {
    score: number; // 0 (spammy) to 100 (excellent)
    rating: "Excellent" | "Good" | "Needs Review" | "High Risk";
    flaggedWords: string[];
  };
};

export type SpintaxRenderResult = {
  subject: string;
  body: string;
  preheader?: string;
  choices: number[]; // indices of options chosen for each spin block
  renderedHash: string; // sha256 hash of the rendered output for duplicate detection
};

/**
 * Common spam trigger words for cold outreach health scoring
 */
const SPAM_TRIGGER_WORDS = [
  "100% free",
  "free money",
  "act now",
  "risk free",
  "winner",
  "congratulations",
  "no catch",
  "guaranteed income",
  "make money",
  "earn cash",
  "pure profit",
  "double your",
  "million dollars",
  "viagra",
  "casino",
  "crypto giveaway",
  "urgent response",
  "bank transfer",
];

/**
 * Parse a template string into AST tokens supporting {{random|opt1|opt2|opt3}} and {{variable|fallback}}
 */
export function parseSpintax(template: string): SpintaxNode[] {
  if (!template) return [];

  const nodes: SpintaxNode[] = [];
  let cursor = 0;
  const len = template.length;

  while (cursor < len) {
    const openIndex = template.indexOf("{{", cursor);

    if (openIndex === -1) {
      nodes.push({ type: "text", value: template.slice(cursor) });
      break;
    }

    if (openIndex > cursor) {
      nodes.push({ type: "text", value: template.slice(cursor, openIndex) });
    }

    // Find closing }}
    const closeIndex = template.indexOf("}}", openIndex + 2);
    if (closeIndex === -1) {
      // Unclosed brace, treat remainder as plain text
      nodes.push({ type: "text", value: template.slice(openIndex) });
      break;
    }

    const inner = template.slice(openIndex + 2, closeIndex);

    if (inner.startsWith("random|")) {
      // Spintax block: {{random|Option 1|Option 2|Option 3}}
      const optionsRaw = splitSpintaxOptions(inner.slice(7));
      const parsedOptions: SpintaxNode[][] = optionsRaw.map((opt) => parseSpintax(opt));
      nodes.push({
        type: "spin",
        options: parsedOptions,
        raw: template.slice(openIndex, closeIndex + 2),
      });
    } else {
      // Variable node: {{firstName}} or {{firstName|fallback}}
      const pipeIndex = inner.indexOf("|");
      if (pipeIndex !== -1) {
        nodes.push({
          type: "var",
          name: inner.slice(0, pipeIndex).trim(),
          fallback: inner.slice(pipeIndex + 1).trim(),
        });
      } else {
        nodes.push({
          type: "var",
          name: inner.trim(),
        });
      }
    }

    cursor = closeIndex + 2;
  }

  return nodes;
}

/**
 * Split options on unescaped pipe |
 */
function splitSpintaxOptions(content: string): string[] {
  const options: string[] = [];
  let current = "";
  let i = 0;

  while (i < content.length) {
    if (content[i] === "\\" && i + 1 < content.length && content[i + 1] === "|") {
      current += "|";
      i += 2;
    } else if (content[i] === "|") {
      options.push(current);
      current = "";
      i++;
    } else {
      current += content[i];
      i++;
    }
  }
  options.push(current);
  return options;
}

/**
 * Count total unique variations and validate grammar & deliverability
 */
export function validateSpintax(
  template: string,
  subjectTemplate?: string
): SpintaxValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fullText = `${subjectTemplate || ""} \n ${template || ""}`;

  // Check unbalanced braces
  let openCount = 0;
  for (let i = 0; i < fullText.length - 1; i++) {
    if (fullText[i] === "{" && fullText[i + 1] === "{") openCount++;
    if (fullText[i] === "}" && fullText[i + 1] === "}") openCount--;
  }
  if (openCount !== 0) {
    errors.push("Unbalanced template braces: check that every {{ has a matching }}");
  }

  const nodes = parseSpintax(template);
  const spinNodes: Array<{ options: SpintaxNode[][]; raw: string }> = [];

  function findSpinNodes(list: SpintaxNode[]) {
    for (const node of list) {
      if (node.type === "spin") {
        spinNodes.push(node);
        for (const optList of node.options) {
          findSpinNodes(optList);
        }
      }
    }
  }

  findSpinNodes(nodes);
  if (subjectTemplate) {
    findSpinNodes(parseSpintax(subjectTemplate));
  }

  let combinations = 1;
  for (let i = 0; i < spinNodes.length; i++) {
    const node = spinNodes[i];
    const optCount = node.options.length;

    if (optCount < 2) {
      errors.push(`Spin block #${i + 1} has only ${optCount} option. Minimum 2 options required.`);
    } else if (optCount === 2) {
      warnings.push(`Spin block #${i + 1} has 2 options. 3 options recommended for 700+ combinations.`);
    } else if (optCount > 5) {
      warnings.push(`Spin block #${i + 1} has ${optCount} options (maximum recommended is 5).`);
    }

    // Check for empty or duplicate options
    const optionStrings = node.options.map((optNodes) =>
      optNodes
        .map((n) => (n.type === "text" ? n.value : n.type === "var" ? `{{${n.name}}}` : "[spin]"))
        .join("")
        .trim()
    );

    const uniqueSet = new Set(optionStrings);
    if (uniqueSet.size < optionStrings.length) {
      warnings.push(`Spin block #${i + 1} contains duplicate variations.`);
    }

    combinations *= Math.max(1, optCount);
  }

  // Estimate min/max characters
  const sampleLead = {
    firstName: "John",
    lastName: "Doe",
    businessName: "Acme Roofing",
    city: "Austin",
    state: "TX",
    industry: "Roofing",
  };

  const sampleRenders: string[] = [];
  for (let i = 0; i < 20; i++) {
    const rendered = renderSpintax(template, sampleLead, {
      seed: `validate-sample-${i}`,
      mode: "random",
    });
    sampleRenders.push(rendered.text);
  }

  const lengths = sampleRenders.map((r) => r.length);
  const minLen = Math.min(...lengths, 0);
  const maxLen = Math.max(...lengths, 0);
  const avgLen = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;

  if (maxLen > 1200) {
    warnings.push("Email length exceeds 1,200 characters in some variations. Shorter cold emails convert better.");
  }

  // Spam score analysis
  const flaggedWords: string[] = [];
  const lowerTemplate = fullText.toLowerCase();
  for (const trigger of SPAM_TRIGGER_WORDS) {
    if (lowerTemplate.includes(trigger)) {
      flaggedWords.push(trigger);
    }
  }

  let spamRating: "Excellent" | "Good" | "Needs Review" | "High Risk" = "Excellent";
  let score = 100;

  if (flaggedWords.length > 0) {
    score -= flaggedWords.length * 20;
    warnings.push(`Found potential spam trigger phrasing: "${flaggedWords.join('", "')}"`);
  }

  if (combinations < 10 && spinNodes.length > 0) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  if (score >= 90) spamRating = "Excellent";
  else if (score >= 75) spamRating = "Good";
  else if (score >= 50) spamRating = "Needs Review";
  else spamRating = "High Risk";

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    blockCount: spinNodes.length,
    uniqueCombinations: combinations,
    characterCounts: { min: minLen, max: maxLen, avg: avgLen },
    spamScore: {
      score,
      rating: spamRating,
      flaggedWords,
    },
  };
}

/**
 * Seeded PRNG (Mulberry32) for deterministic rendering
 */
function createSeededRng(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }

  return function () {
    h |= 0;
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Render a single AST node list
 */
function renderNodes(
  nodes: SpintaxNode[],
  lead: Record<string, any>,
  rng: () => number,
  choices: number[],
  mode: "random" | "even" | "weighted" = "random",
  weights?: number[][]
): string {
  let result = "";

  for (const node of nodes) {
    if (node.type === "text") {
      result += node.value;
    } else if (node.type === "var") {
      const val = lead[node.name] ?? lead[camelToSnake(node.name)] ?? node.fallback ?? "";
      result += String(val);
    } else if (node.type === "spin") {
      const opts = node.options;
      if (opts.length === 0) continue;

      let pickedIndex = 0;
      if (mode === "random" || mode === "even") {
        pickedIndex = Math.floor(rng() * opts.length);
      } else if (mode === "weighted" && weights && weights[choices.length]) {
        const blockWeights = weights[choices.length];
        const r = rng();
        let cumulative = 0;
        for (let j = 0; j < opts.length; j++) {
          cumulative += blockWeights[j] || 1 / opts.length;
          if (r <= cumulative) {
            pickedIndex = j;
            break;
          }
        }
      } else {
        pickedIndex = Math.floor(rng() * opts.length);
      }

      choices.push(pickedIndex);
      const chosenSubNodes = opts[pickedIndex] || [];
      result += renderNodes(chosenSubNodes, lead, rng, choices, mode, weights);
    }
  }

  return result;
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Normalizes lead record for variable interpolation
 */
export function normalizeLeadVars(lead: Record<string, any>): Record<string, any> {
  const firstName =
    lead.firstName ||
    (lead.ownerName || "").trim().split(/\s+/)[0] ||
    (lead.name || "").trim().split(/\s+/)[0] ||
    "there";

  const lastName =
    lead.lastName ||
    (lead.ownerName ? lead.ownerName.trim().split(/\s+/).slice(1).join(" ") : "") ||
    "";

  return {
    firstName,
    first_name: firstName,
    lastName,
    last_name: lastName,
    ownerName: lead.ownerName || lead.name || firstName,
    owner_name: lead.ownerName || lead.name || firstName,
    businessName: lead.businessName || lead.companyName || lead.company || "your company",
    business_name: lead.businessName || lead.companyName || lead.company || "your company",
    company: lead.businessName || lead.companyName || "your company",
    companyName: lead.businessName || lead.companyName || "your company",
    city: lead.city || "your area",
    state: lead.state || "",
    country: lead.country || "US",
    industry: lead.industry || "Contractor",
    phone: lead.phone || "",
    email: lead.email || "",
    outreachAngle: lead.outreachAngle || "",
    custom_personalised_opening_line: lead.outreachAngle || `I noticed your roofing business presence in ${lead.city || "your area"}.`,
    fromName: lead.fromName || "Our Team",
    from_name: lead.fromName || "Our Team",
    ...lead,
  };
}

/**
 * Render spintax template deterministically for a lead.
 * Seed is derived from: hash(campaignId + stepId + leadId)
 */
export function renderSpintax(
  template: string,
  lead: Record<string, any>,
  options: {
    seed?: string;
    campaignId?: string;
    stepId?: string;
    leadId?: string;
    mode?: "random" | "even" | "weighted";
    weights?: number[][];
  }
): { text: string; choices: number[] } {
  const normLead = normalizeLeadVars(lead);
  const seedKey =
    options.seed ||
    `${options.campaignId || "camp"}:${options.stepId || "step"}:${options.leadId || lead.id || lead.email || "lead"}`;

  const rng = createSeededRng(seedKey);
  const nodes = parseSpintax(template);
  const choices: number[] = [];

  const text = renderNodes(nodes, normLead, rng, choices, options.mode || "random", options.weights);
  return { text: text.replace(/\n{3,}/g, "\n\n").trim(), choices };
}

/**
 * Complete email render (subject + body + preheader) for outreach send
 */
export function renderOutreachEmail(
  templates: {
    subject: string;
    body: string;
    preheader?: string;
    signature?: string;
  },
  lead: Record<string, any>,
  context: {
    campaignId: string;
    stepId: string;
    leadId: string;
    mode?: "random" | "even" | "weighted";
  }
): SpintaxRenderResult {
  const normLead = normalizeLeadVars(lead);
  const seedKey = `${context.campaignId}:${context.stepId}:${context.leadId}`;
  const rng = createSeededRng(seedKey);

  const subjectNodes = parseSpintax(templates.subject);
  const bodyNodes = parseSpintax(templates.body);
  const preheaderNodes = templates.preheader ? parseSpintax(templates.preheader) : [];
  const signatureNodes = templates.signature ? parseSpintax(templates.signature) : [];

  const choices: number[] = [];
  const subject = renderNodes(subjectNodes, normLead, rng, choices, context.mode || "random").trim();
  let body = renderNodes(bodyNodes, normLead, rng, choices, context.mode || "random").trim();

  if (templates.signature) {
    const renderedSig = renderNodes(signatureNodes, normLead, rng, choices, context.mode || "random").trim();
    if (renderedSig) {
      body += `\n\n${renderedSig}`;
    }
  }

  const preheader = templates.preheader
    ? renderNodes(preheaderNodes, normLead, rng, choices, context.mode || "random").trim()
    : undefined;

  // Fast deterministic hash for client/server cross-compatibility
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  const hashInput = `${subject}:::${body}`;
  for (let i = 0; i < hashInput.length; i++) {
    const ch = hashInput.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const renderedHash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, "0");

  return {
    subject,
    body,
    preheader,
    choices,
    renderedHash,
  };
}
