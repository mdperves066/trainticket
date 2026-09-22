/**
 * Centralized Bangladesh Time (Asia/Dhaka, UTC+6) Formatter.
 * Resolves UTC vs Local Timezone offsets so all timestamps strictly reflect Bangladesh Standard Time.
 */

export function formatDhakaTime(isoStr: string | Date | undefined | null): string {
  if (!isoStr) return "-";
  try {
    let dateObj: Date;
    if (typeof isoStr === "string") {
      // If the ISO string lacks 'Z' or timezone offset, append 'Z' so it parses as UTC
      const hasOffset = isoStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoStr);
      const cleanIso = hasOffset ? isoStr : `${isoStr}Z`;
      dateObj = new Date(cleanIso);
    } else {
      dateObj = isoStr;
    }

    if (isNaN(dateObj.getTime())) {
      return String(isoStr);
    }

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(dateObj);
  } catch (err) {
    return String(isoStr);
  }
}

export function formatDhakaDateTime(isoStr: string | Date | undefined | null): string {
  if (!isoStr) return "-";
  try {
    let dateObj: Date;
    if (typeof isoStr === "string") {
      const hasOffset = isoStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoStr);
      const cleanIso = hasOffset ? isoStr : `${isoStr}Z`;
      dateObj = new Date(cleanIso);
    } else {
      dateObj = isoStr;
    }

    if (isNaN(dateObj.getTime())) {
      return String(isoStr);
    }

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(dateObj);
  } catch (err) {
    return String(isoStr);
  }
}

/**
 * Checks if a check timestamp is stale (older than threshold seconds).
 * Default threshold: 45 seconds.
 */
export function isTimestampStale(isoStr: string | Date | undefined | null, thresholdSec = 45): boolean {
  if (!isoStr) return true;
  try {
    const hasOffset = typeof isoStr === "string" && (isoStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoStr));
    const cleanIso = typeof isoStr === "string" ? (hasOffset ? isoStr : `${isoStr}Z`) : isoStr;
    const dateObj = new Date(cleanIso);
    if (isNaN(dateObj.getTime())) return true;

    const diffSeconds = (Date.now() - dateObj.getTime()) / 1000;
    return diffSeconds > thresholdSec;
  } catch {
    return true;
  }
}
