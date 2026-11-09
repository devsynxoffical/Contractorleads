/**
 * Unibox labels. One label per thread; changes are logged in InboxLabelHistory.
 *
 * `auto` labels can be applied by the rules engine (src/lib/unibox/classifier.ts).
 * Meeting Booked, Meeting Completed and Closed are manual-only business decisions
 * (spec rules 4 and 5) and are never applied from keywords.
 */
export type UniboxLabelId =
  | "interested"
  | "not_interested"
  | "bad_timing"
  | "out_of_office"
  | "automatic_reply"
  | "meeting_booked"
  | "meeting_completed"
  | "wrong_person"
  | "referral"
  | "closed"
  | "unlabelled";

export type UniboxLabel = {
  id: UniboxLabelId;
  name: string;
  /** Hex colour for the badge dot */
  color: string;
  /** Badge classes (light and dark) */
  badge: string;
  auto: boolean;
  sortOrder: number;
  meaning: string;
  nextAction: string;
};

export const UNIBOX_LABELS: UniboxLabel[] = [
  {
    id: "interested",
    name: "Interested",
    color: "#EC4899",
    badge: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:ring-pink-500/30",
    auto: true,
    sortOrder: 1,
    meaning: "Wants to learn more or talk.",
    nextAction: "Reply fast and book a call.",
  },
  {
    id: "meeting_booked",
    name: "Meeting Booked",
    color: "#16A34A",
    badge: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30",
    auto: false,
    sortOrder: 2,
    meaning: "A call or meeting is confirmed.",
    nextAction: "Send the invite and prepare.",
  },
  {
    id: "meeting_completed",
    name: "Meeting Completed",
    color: "#0D9488",
    badge: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/30",
    auto: false,
    sortOrder: 3,
    meaning: "The meeting has happened.",
    nextAction: "Send the follow-up or proposal.",
  },
  {
    id: "closed",
    name: "Closed",
    color: "#C026D3",
    badge: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-500/30",
    auto: false,
    sortOrder: 4,
    meaning: "Deal outcome decided (won or lost).",
    nextAction: "Archive; start onboarding if won.",
  },
  {
    id: "bad_timing",
    name: "Bad Timing",
    color: "#F97316",
    badge: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30",
    auto: true,
    sortOrder: 5,
    meaning: "Not now, but not a hard no.",
    nextAction: "Follow up on the date they gave.",
  },
  {
    id: "referral",
    name: "Referral",
    color: "#7C3AED",
    badge: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
    auto: true,
    sortOrder: 6,
    meaning: "Passed you to someone else.",
    nextAction: "Contact the referral and mention who referred you.",
  },
  {
    id: "wrong_person",
    name: "Wrong Person",
    color: "#FB7185",
    badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
    auto: true,
    sortOrder: 7,
    meaning: "Not the decision-maker.",
    nextAction: "Find the right contact.",
  },
  {
    id: "out_of_office",
    name: "Out of Office",
    color: "#EAB308",
    badge: "bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30",
    auto: true,
    sortOrder: 8,
    meaning: "Away for now (auto-reply).",
    nextAction: "Follow up after they return.",
  },
  {
    id: "not_interested",
    name: "Not Interested",
    color: "#DC2626",
    badge: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
    auto: true,
    sortOrder: 9,
    meaning: "Declined or asked to be removed.",
    nextAction: "Do not contact again.",
  },
  {
    id: "automatic_reply",
    name: "Automatic Reply",
    color: "#84CC16",
    badge: "bg-lime-50 text-lime-800 ring-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:ring-lime-500/30",
    auto: true,
    sortOrder: 10,
    meaning: "System message, bounce or ticket receipt.",
    nextAction: "No sales action needed.",
  },
  {
    id: "unlabelled",
    name: "Unlabelled",
    color: "#94A3B8",
    badge: "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/15",
    auto: true,
    sortOrder: 11,
    meaning: "Not classified yet.",
    nextAction: "Read and label it.",
  },
];

const BY_ID = new Map(UNIBOX_LABELS.map((l) => [l.id, l]));

export function getUniboxLabel(id: string | null | undefined): UniboxLabel {
  return BY_ID.get((id ?? "unlabelled") as UniboxLabelId) ?? BY_ID.get("unlabelled")!;
}

export function isUniboxLabelId(id: unknown): id is UniboxLabelId {
  return typeof id === "string" && BY_ID.has(id as UniboxLabelId);
}
