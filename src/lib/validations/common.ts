import { z } from "zod";

/**
 * Reusable building blocks for form schemas.
 *
 * Keeping these here means every form validates fields the same way. Individual
 * form schemas compose these pieces instead of repeating the rules.
 */

/** Trimmed, non-empty single-line input (names, titles, locations). */
export const requiredText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/** Free-text area with a sensible minimum so vague reports can be caught. */
export const requiredParagraph = (label: string, min = 20, max = 2000) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/** Indian campus context: 10 digits, optionally starting with 0 or +91. */
export const phoneNumber = z
  .string()
  .trim()
  .regex(/^(\+?91[- ]?)?[0-9]{10}$/, "Enter a valid 10-digit phone number.");

/** Checkbox-style consent, required before a complaint can be submitted. */
export const consent = z.literal(true, {
  error: "Please confirm before submitting.",
});
