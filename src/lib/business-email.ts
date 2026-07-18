/** Free / consumer mailbox domains blocked for agency signup. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "zoho.com",
  "pm.me",
  "hey.com",
]);

export function isBusinessEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) return false;
  const domain = normalized.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".")) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export function businessEmailError(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!isBusinessEmail(email)) {
    return "Use your official business email (Gmail, Yahoo, Outlook, and other free inboxes are not allowed).";
  }
  return null;
}
