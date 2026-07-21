/** Shared brand tokens for HTML email (inline CSS only). */

export const EMAIL_BRAND = {
  name: "Contractor Leads",
  tagline: "Find high-quality home service leads across America",
  primary: "#e6007e",
  secondary: "#7b1fa2",
  ink: "#1a1224",
  muted: "#5b5268",
  faint: "#8b8398",
  border: "#ebe4f2",
  softBg: "#f7f2fa",
  pageBg: "#ebe6df",
  cardBg: "#ffffff",
  buttonBg: "#1a1224",
  buttonText: "#ffffff",
  link: "#7b1fa2",
  /** Physical address for CAN-SPAM / deliverability */
  address:
    process.env.EMAIL_COMPANY_ADDRESS ||
    "Contractor Leads · United States",
  supportEmail: process.env.EMAIL_SUPPORT || "support@contractorleads.us",
  logoUrl:
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/logo.png`
      : "https://wwww.contractorleads.us/logo.png",
} as const;

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
