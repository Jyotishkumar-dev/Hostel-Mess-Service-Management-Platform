import { z } from "zod";
import { COMPLAINT_CATEGORIES, SERVICE_AREAS } from "@/types/complaint";
import { requiredParagraph, requiredText } from "@/lib/validations/common";

/**
 * Select-field schemas.
 *
 * These derive straight from the domain constants in `src/types/complaint.ts`,
 * so adding a category or service area to the type automatically updates the
 * form options and the validation.
 */

export const serviceAreaSchema = z.enum(SERVICE_AREAS, {
  error: "Select whether this is a hostel or a mess issue.",
});

export const complaintCategorySchema = z.enum(COMPLAINT_CATEGORIES, {
  error: "Choose the category that fits best.",
});

/**
 * Example form schema.
 *
 * This is deliberately small. It exists to show the pattern every form schema
 * in the app will follow: compose the shared building blocks, derive the option
 * lists from the domain types, and export both the schema and the inferred
 * form-values type.
 *
 * The full complaint schema (priority, evidence upload, contact details,
 * duplicate hints) gets added in Phase 2 when Supabase is connected.
 */
export const complaintDraftSchema = z.object({
  area: serviceAreaSchema,
  category: complaintCategorySchema,
  location: requiredText("Location", 80),
  title: requiredText("Summary", 100),
  description: requiredParagraph("Description", 20, 1000),
});

/** Inferred form values type — always derive it from the schema. */
export type ComplaintDraftValues = z.infer<typeof complaintDraftSchema>;

/** Default values used to reset the form after a submit attempt. */
export const complaintDraftDefaults: ComplaintDraftValues = {
  area: "hostel",
  category: "water",
  location: "",
  title: "",
  description: "",
};
