/** Small formatting helpers shared across the dashboards. */

const numberFormat = new Intl.NumberFormat("en-IN");

/** 1234 -> "1,234" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Joins class names. Re-exported from `@/lib/utils` for convenience. */
export { cn } from "@/lib/utils";

/** Trims a long string and adds an ellipsis, for table cells. */
export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** "1 issue" / "3 issues" */
export function pluralise(count: number, singular: string, plural?: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/**
 * Date formatting.
 *
 * Phase 3 stores real `timestamptz` values but the UI still renders a
 * pre-formatted string, so the conversion happens once at the mapper boundary
 * instead of scattering `Intl` calls through every component.
 */

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "2026-03-16T09:35:00Z" -> "16 Mar, 9:35 am" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormat.format(date);
}

/** "2026-03-16T09:35:00Z" -> "16 Mar 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormat.format(date);
}

/**
 * "2026-03-16T09:35:00Z" -> "2 hours ago".
 *
 * Deliberately not an absolute date: on a tracking screen "20 minutes ago"
 * answers "is this being worked on?" in a way that "16 Mar 2026" does not.
 * Anything older than 30 days falls back to an absolute date, because
 * "35 days ago" stops being useful.
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diff = date.getTime() - Date.now();
  const absolute = Math.abs(diff);

  if (absolute < MINUTE) return "just now";
  if (absolute > 30 * DAY) return formatDate(iso);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * DAY],
    ["month", 30 * DAY],
    ["day", DAY],
    ["hour", HOUR],
    ["minute", MINUTE],
  ];

  for (const [unit, ms] of units) {
    if (absolute >= ms) {
      return relativeFormat.format(Math.round(diff / ms), unit);
    }
  }

  return "just now";
}

/** First letters of a name, e.g. "Aarav Sharma" -> "AS". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
