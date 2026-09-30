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
