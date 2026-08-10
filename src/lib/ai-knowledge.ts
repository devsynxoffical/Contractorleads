import {
  ACADEMY_ARTICLES,
  ACADEMY_FAQS,
  type AcademyArticle,
  type AcademyFaq,
} from "@/lib/academy-content";

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "do", "does", "for", "from", "get", "got", "had", "has", "have", "how",
  "i", "i'm", "if", "in", "into", "is", "it", "its", "me", "my", "of",
  "on", "or", "our", "out", "so", "that", "the", "their", "them", "there",
  "these", "they", "this", "to", "up", "us", "we", "what", "when", "where",
  "which", "why", "will", "with", "you", "your",
]);

/** Lowercase keyword tokens from a query, stopwords removed. */
function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreArticle(article: AcademyArticle, terms: Set<string>): number {
  if (!terms.size) return 0;
  const title = `${article.title} ${article.tags.join(" ")}`.toLowerCase();
  const summary = article.summary.toLowerCase();
  const bodies = article.sections
    .map((s) => `${s.heading} ${s.body} ${(s.bullets ?? []).join(" ")}`)
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 3;
    if (summary.includes(term)) score += 1.5;
    if (bodies.includes(term)) score += 1;
  }
  return score;
}

function scoreFaq(faq: AcademyFaq, terms: Set<string>): number {
  if (!terms.size) return 0;
  const hay = `${faq.question} ${faq.answer}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (hay.includes(term)) score += 1;
  }
  return score;
}

function compactArticle(article: AcademyArticle): string {
  const sections = article.sections
    .map((s) => {
      const body = s.body.length > 320 ? `${s.body.slice(0, 320)}…` : s.body;
      const tip = s.tip ? ` Tip: ${s.tip}` : "";
      return `- ${s.heading}: ${body}${tip}`;
    })
    .slice(0, 6);
  return `### ${article.title} (${article.category})
${article.summary}
${sections.join("\n")}
Source: /academy/${article.slug}`;
}

/**
 * Build a grounded product-knowledge block for the AI. Retrieves the top
 * Academy guides and FAQs that match the user's message (keyword scoring) and
 * returns a compact text snippet injected into the system prompt — the
 * "brain" that keeps answers on-platform instead of generic/hallucinated.
 */
export function buildKnowledgeContext(query: string): string {
  const terms = new Set(tokens(query));
  const articles = ACADEMY_ARTICLES.map((a) => ({
    a,
    score: scoreArticle(a, terms),
  }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);

  const faqs = ACADEMY_FAQS.map((f) => ({ f, score: scoreFaq(f, terms) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);

  if (!articles.length && !faqs.length) return "";

  const blocks: string[] = [
    "Below is the platform's own help-center knowledge. Prefer this over generic advice when it covers the question, and cite the matching article/FAQ.",
  ];
  if (articles.length) {
    blocks.push(
      "RELEVANT GUIDES:\n" +
        articles.map((x) => compactArticle(x.a)).join("\n\n"),
    );
  }
  if (faqs.length) {
    blocks.push(
      "QUICK FAQ ANSWERS:\n" +
        faqs
          .map((x) => {
            const answer =
              x.f.answer.length > 500
                ? `${x.f.answer.slice(0, 500)}…`
                : x.f.answer;
            return `Q: ${x.f.question}\nA: ${answer}`;
          })
          .join("\n\n"),
    );
  }
  return blocks.join("\n\n");
}
