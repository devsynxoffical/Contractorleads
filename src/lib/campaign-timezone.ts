/**
 * Timezone & Scheduling Engine for Contractor Leads Outreach Campaigns
 * Supports USA, Canada, United Kingdom, Australia, New Zealand, and Custom IANA timezones.
 * Handles Daylight Saving Time (DST) automatically via native Intl time formatting.
 */

export type SupportedMarket = "US" | "CA" | "GB" | "AU" | "NZ" | "CUSTOM";

export type TimezoneOption = {
  id: string;
  name: string;
  market: SupportedMarket;
  marketLabel: string;
  iana: string;
  utcOffsetApprox: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // United States
  { id: "us_eastern", name: "Eastern Time (ET) — New York, Miami, Atlanta", market: "US", marketLabel: "USA", iana: "America/New_York", utcOffsetApprox: "UTC-5 / UTC-4" },
  { id: "us_central", name: "Central Time (CT) — Chicago, Dallas, Houston", market: "US", marketLabel: "USA", iana: "America/Chicago", utcOffsetApprox: "UTC-6 / UTC-5" },
  { id: "us_mountain", name: "Mountain Time (MT) — Denver, Phoenix, Salt Lake City", market: "US", marketLabel: "USA", iana: "America/Denver", utcOffsetApprox: "UTC-7 / UTC-6" },
  { id: "us_pacific", name: "Pacific Time (PT) — Los Angeles, Seattle, San Francisco", market: "US", marketLabel: "USA", iana: "America/Los_Angeles", utcOffsetApprox: "UTC-8 / UTC-7" },
  { id: "us_alaska", name: "Alaska Time (AKT) — Anchorage", market: "US", marketLabel: "USA", iana: "America/Anchorage", utcOffsetApprox: "UTC-9 / UTC-8" },
  { id: "us_hawaii", name: "Hawaii-Aleutian Time (HAT) — Honolulu", market: "US", marketLabel: "USA", iana: "Pacific/Honolulu", utcOffsetApprox: "UTC-10" },

  // Canada
  { id: "ca_eastern", name: "Canada Eastern (ET) — Toronto, Montreal, Ottawa", market: "CA", marketLabel: "Canada", iana: "America/Toronto", utcOffsetApprox: "UTC-5 / UTC-4" },
  { id: "ca_central", name: "Canada Central (CT) — Winnipeg", market: "CA", marketLabel: "Canada", iana: "America/Winnipeg", utcOffsetApprox: "UTC-6 / UTC-5" },
  { id: "ca_mountain", name: "Canada Mountain (MT) — Calgary, Edmonton", market: "CA", marketLabel: "Canada", iana: "America/Edmonton", utcOffsetApprox: "UTC-7 / UTC-6" },
  { id: "ca_pacific", name: "Canada Pacific (PT) — Vancouver", market: "CA", marketLabel: "Canada", iana: "America/Vancouver", utcOffsetApprox: "UTC-8 / UTC-7" },
  { id: "ca_atlantic", name: "Canada Atlantic (AT) — Halifax", market: "CA", marketLabel: "Canada", iana: "America/Halifax", utcOffsetApprox: "UTC-4 / UTC-3" },
  { id: "ca_newfoundland", name: "Newfoundland Time (NT) — St. John's", market: "CA", marketLabel: "Canada", iana: "America/St_Johns", utcOffsetApprox: "UTC-3:30 / UTC-2:30" },

  // United Kingdom
  { id: "gb_london", name: "United Kingdom (GMT / BST) — London, Manchester, Edinburgh", market: "GB", marketLabel: "United Kingdom", iana: "Europe/London", utcOffsetApprox: "UTC+0 / UTC+1" },

  // Australia
  { id: "au_sydney", name: "Australian Eastern (AEST / AEDT) — Sydney, Melbourne, Canberra", market: "AU", marketLabel: "Australia", iana: "Australia/Sydney", utcOffsetApprox: "UTC+10 / UTC+11" },
  { id: "au_brisbane", name: "Australian Eastern Standard (AEST - No DST) — Brisbane", market: "AU", marketLabel: "Australia", iana: "Australia/Brisbane", utcOffsetApprox: "UTC+10" },
  { id: "au_adelaide", name: "Australian Central (ACST / ACDT) — Adelaide", market: "AU", marketLabel: "Australia", iana: "Australia/Adelaide", utcOffsetApprox: "UTC+9:30 / UTC+10:30" },
  { id: "au_perth", name: "Australian Western (AWST) — Perth", market: "AU", marketLabel: "Australia", iana: "Australia/Perth", utcOffsetApprox: "UTC+8" },

  // New Zealand
  { id: "nz_auckland", name: "New Zealand (NZST / NZDT) — Auckland, Wellington, Christchurch", market: "NZ", marketLabel: "New Zealand", iana: "Pacific/Auckland", utcOffsetApprox: "UTC+12 / UTC+13" },
];

/** State to IANA timezone lookup for smart Recipient Local-Time resolution */
const US_STATE_TIMEZONES: Record<string, string> = {
  // Eastern
  CT: "America/New_York", DE: "America/New_York", FL: "America/New_York", GA: "America/New_York",
  IN: "America/New_York", KY: "America/New_York", ME: "America/New_York", MD: "America/New_York",
  MA: "America/New_York", MI: "America/New_York", NH: "America/New_York", NJ: "America/New_York",
  NY: "America/New_York", NC: "America/New_York", OH: "America/New_York", PA: "America/New_York",
  RI: "America/New_York", SC: "America/New_York", VT: "America/New_York", VA: "America/New_York",
  WV: "America/New_York", DC: "America/New_York",
  // Central
  AL: "America/Chicago", AR: "America/Chicago", IL: "America/Chicago", IA: "America/Chicago",
  KS: "America/Chicago", LA: "America/Chicago", MN: "America/Chicago", MS: "America/Chicago",
  MO: "America/Chicago", NE: "America/Chicago", ND: "America/Chicago", OK: "America/Chicago",
  SD: "America/Chicago", TN: "America/Chicago", TX: "America/Chicago", WI: "America/Chicago",
  // Mountain
  AZ: "America/Phoenix", CO: "America/Denver", ID: "America/Denver", MT: "America/Denver",
  NM: "America/Denver", UT: "America/Denver", WY: "America/Denver",
  // Pacific
  CA: "America/Los_Angeles", NV: "America/Los_Angeles", OR: "America/Los_Angeles", WA: "America/Los_Angeles",
  // Alaska & Hawaii
  AK: "America/Anchorage", HI: "Pacific/Honolulu",
};

const CA_PROVINCE_TIMEZONES: Record<string, string> = {
  ON: "America/Toronto", QC: "America/Toronto", MB: "America/Winnipeg",
  SK: "America/Regina", AB: "America/Edmonton", BC: "America/Vancouver",
  NS: "America/Halifax", NB: "America/Halifax", NL: "America/St_Johns",
  PE: "America/Halifax",
};

const AU_STATE_TIMEZONES: Record<string, string> = {
  NSW: "Australia/Sydney", VIC: "Australia/Sydney", ACT: "Australia/Sydney",
  QLD: "Australia/Brisbane", SA: "Australia/Adelaide", WA: "Australia/Perth",
  TAS: "Australia/Sydney", NT: "Australia/Darwin",
};

/**
 * Automatically determine prospect's local IANA timezone from state, city, or country.
 */
export function resolveRecipientTimezone(lead: {
  state?: string | null;
  city?: string | null;
  country?: string | null;
}): string {
  const country = (lead.country || "US").toUpperCase().trim();
  const rawState = (lead.state || "").toUpperCase().trim();

  if (country === "US" || country === "USA" || country === "UNITED STATES") {
    if (rawState && US_STATE_TIMEZONES[rawState]) {
      return US_STATE_TIMEZONES[rawState];
    }
    // Check state full name match
    const foundState = Object.entries(STATE_NAME_MAP).find(
      ([code, name]) => name.toUpperCase() === rawState || code === rawState
    );
    if (foundState && US_STATE_TIMEZONES[foundState[0]]) {
      return US_STATE_TIMEZONES[foundState[0]];
    }
    return "America/New_York"; // Default US fallback
  }

  if (country === "CA" || country === "CAN" || country === "CANADA") {
    if (rawState && CA_PROVINCE_TIMEZONES[rawState]) {
      return CA_PROVINCE_TIMEZONES[rawState];
    }
    return "America/Toronto";
  }

  if (country === "GB" || country === "UK" || country === "UNITED KINGDOM" || country === "ENGLAND" || country === "SCOTLAND") {
    return "Europe/London";
  }

  if (country === "AU" || country === "AUS" || country === "AUSTRALIA") {
    if (rawState && AU_STATE_TIMEZONES[rawState]) {
      return AU_STATE_TIMEZONES[rawState];
    }
    return "Australia/Sydney";
  }

  if (country === "NZ" || country === "NEW ZEALAND") {
    return "Pacific/Auckland";
  }

  return "America/New_York";
}

const STATE_NAME_MAP: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/** Get local time parts (hour, minute, dayOfWeek) for any given IANA timezone */
export function getLocalTimeInTimezone(date: Date, timezone: string): {
  hour: number;
  minute: number;
  dayOfWeek: string; // "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  formatted: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      weekday: "short",
    });

    const parts = formatter.formatToParts(date);
    let hour = 0;
    let minute = 0;
    let weekday = "Mon";

    for (const p of parts) {
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
      if (p.type === "weekday") weekday = p.value;
    }

    const dayMap: Record<string, string> = {
      Mon: "mon",
      Tue: "tue",
      Wed: "wed",
      Thu: "thu",
      Fri: "fri",
      Sat: "sat",
      Sun: "sun",
    };

    const dayOfWeek = dayMap[weekday] || "mon";
    const displayHour = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    const formatted = `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm} (${timezone.split("/").pop()?.replace(/_/g, " ")})`;

    return { hour, minute, dayOfWeek, formatted };
  } catch {
    return {
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      dayOfWeek: "mon",
      formatted: `${date.getUTCHours()}:${date.getUTCMinutes()} UTC`,
    };
  }
}

/** Check whether a given timestamp is within the permitted sending window and days */
export function isWithinSendingWindow(
  date: Date,
  timezone: string,
  sendingDays: string[],
  windowStart: string = "09:00",
  windowEnd: string = "17:00"
): boolean {
  const { hour, minute, dayOfWeek } = getLocalTimeInTimezone(date, timezone);

  // Check day of week
  const normalizedDays = sendingDays.map((d) => d.toLowerCase());
  if (!normalizedDays.includes(dayOfWeek)) {
    return false;
  }

  // Parse start and end hours/minutes
  const [startH, startM = 0] = windowStart.split(":").map((n) => parseInt(n, 10));
  const [endH, endM = 0] = windowEnd.split(":").map((n) => parseInt(n, 10));

  const currentMinutes = hour * 60 + minute;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/** Compute human-like jitter delay between min and max minutes */
export function calculateJitterDelayMs(minMinutes: number = 4, maxMinutes: number = 7): number {
  const min = Math.max(1, minMinutes);
  const max = Math.max(min, maxMinutes);
  const selectedMinutes = min + Math.random() * (max - min);
  return Math.round(selectedMinutes * 60 * 1000);
}
