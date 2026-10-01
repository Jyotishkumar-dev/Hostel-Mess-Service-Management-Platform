import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  SERVICE_AREAS,
  categoriesForArea,
  type ServiceArea,
} from "@/types/complaint";
import { requiredParagraph, requiredText } from "@/lib/validations/common";

/**
 * Complaint form validation.
 *
 * Two rules are enforced here rather than in the component:
 *   1. Every field has a shape and a length limit.
 *   2. The chosen category must belong to the chosen service area, so a student
 *      cannot report a mess problem under "Water supply".
 *
 * The same rule is repeated as a SQL CHECK constraint in migration 0002. The
 * database is the real guarantee — this exists so the student finds out on the
 * form instead of after pressing submit.
 */

export const serviceAreaSchema = z.enum(SERVICE_AREAS, {
  error: "Select whether this is a hostel or a mess issue.",
});

export const complaintCategorySchema = z.enum(COMPLAINT_CATEGORIES, {
  error: "Choose the category that fits best.",
});

export const complaintSchema = z
  .object({
    serviceType: serviceAreaSchema,
    category: complaintCategorySchema,
    title: requiredText("Title", 120).min(
      5,
      "Title must be at least 5 characters — name the problem in a few words.",
    ),
    description: requiredParagraph("Description", 20, 2000),
    location: requiredText("Location", 120),
  })
  .superRefine((values, ctx) => {
    const allowed = categoriesForArea(values.serviceType) as readonly string[];

    if (!allowed.includes(values.category)) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message:
          values.serviceType === "hostel"
            ? "That category is for mess issues. Pick a hostel category."
            : "That category is for hostel issues. Pick a mess category.",
      });
    }
  });

/** Inferred form values type — always derive it from the schema. */
export type ComplaintValues = z.infer<typeof complaintSchema>;

/** Default values used to reset the form after a submit attempt. */
export const complaintDefaults: ComplaintValues = {
  serviceType: "hostel",
  category: "water",
  title: "",
  description: "",
  location: "",
};

/**
 * Keeps a default category valid whenever the student switches service type.
 * Without this, changing Hostel -> Mess would leave a hostel category selected.
 */
export function defaultCategoryFor(area: ServiceArea) {
  return categoriesForArea(area)[0];
}