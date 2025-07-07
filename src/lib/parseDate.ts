import { isValid, parseISO } from "date-fns";

/**
 * Parses a value as a Date.
 * Supports ISO strings, Unix timestamps (seconds or ms), or Date objects.
 * Returns a valid Date or null.
 */
export function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === "number") {
    // If 10 digits, treat as seconds; if 13, as ms
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return isValid(date) ? date : null;
  }

  if (typeof value === "string") {
    // Try ISO string
    const isoDate = parseISO(value);
    if (isValid(isoDate)) return isoDate;

    // Fallback: treat as numeric string (timestamp)
    if (/^\d+$/.test(value)) {
      const num = Number(value);
      const ms = num < 1e12 ? num * 1000 : num;
      const date = new Date(ms);
      return isValid(date) ? date : null;
    }
  }

  return null;
}
