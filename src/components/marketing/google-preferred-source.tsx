/**
 * "Add as a preferred source on Google" button. A plain link to Google's source preferences page
 * for our domain; logged-in visitors can tick the box there to see more of our articles in Top Stories.
 * No script or Google setup needed.
 */
export const PREFERRED_SOURCE_URL = "https://www.google.com/preferences/source?q=contractorleads.us";

export function GooglePreferredSourceButton({
  label = "Add Contractor Leads as a preferred source on Google",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={PREFERRED_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 rounded-lg bg-[#1a73e8] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#1765cc] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1a73e8]/30 ${className}`}
    >
      <span
        aria-hidden
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white font-[Arial,sans-serif] text-[13px] font-bold leading-none text-[#1a73e8]"
      >
        G
      </span>
      {label}
    </a>
  );
}
