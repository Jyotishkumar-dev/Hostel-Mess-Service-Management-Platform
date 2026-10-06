import { z } from "zod";
import {
  HOSTEL_CATEGORIES,
  MESS_CATEGORIES,
  COMPLAINT_PRIORITIES,
  type ComplaintCategory,
} from "@/types/complaint";

/**
 * Controlled vocabulary for the department suggestion. Mirrors the operational
 * teams the app routes work to. The AI must pick one of these — never invent a
 * new value.
 */
export const AI_DEPARTMENTS = [
  "Hostel Maintenance",
  "Electrical Maintenance",
  "Plumbing",
  "Cleaning",
  "Mess Management",
  "Food Quality",
  "Security",
  "IT / Wi-Fi",
  "Laundry",
  "Other",
] as const;

const ALL_CATEGORIES = [...HOSTEL_CATEGORIES, ...MESS_CATEGORIES];

/**
 * What the Gemini model is asked to return for one complaint.
 *
 * Validated with Zod before it is trusted — a malformed response falls back to
 * "processing failed" instead of crashing the workflow.
 */
export const aiSuggestionSchema = z.object({
  category: z.enum(ALL_CATEGORIES, {
    error: "Pick a category from the allowed list.",
  }),
  priority: z.enum(COMPLAINT_PRIORITIES, {
    error: "Pick a priority from the allowed list.",
  }),
  priority_reason: z.string().min(1, "Include a reason for the priority."),
  summary: z.string().min(1, "Include a short summary."),
  department: z.enum(AI_DEPARTMENTS, {
    error: "Pick a department from the allowed list.",
  }),
  duplicate_candidate: z.boolean(),
  duplicate_complaint_id: z.string().uuid().nullish(),
  duplicate_reason: z.string().nullish(),
  confidence: z
    .number({ error: "Confidence must be a number between 0 and 1." })
    .min(0, "Confidence must be at least 0.")
    .max(1, "Confidence must be at most 1."),
});

export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;

/** A minimal, PII-safe view of a complaint sent to the model for matching. */
export interface DuplicateCandidate {
  id: string;
  title: string;
  category: ComplaintCategory;
  area: string;
  location: string;
  status: string;
}

/** The complaint text + candidates we send to the model. */
export interface AiInput {
  serviceType: string;
  category: string | null;
  title: string;
  description: string;
  location: string;
  candidates: DuplicateCandidate[];
}
