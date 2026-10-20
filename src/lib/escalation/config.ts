export const ESCALATION_THRESHOLDS_HOURS: Record<string, number> = {
  critical: 6,
  high: 12,
  medium: 24,
  low: 48,
};

export function getEscalationThreshold(priority: string): number {
  return ESCALATION_THRESHOLDS_HOURS[priority] ?? 24;
}
