/**
 * Validation entry point.
 *
 * Form components import schemas from here, never from Zod directly.
 * This keeps validation rules out of the UI layer and gives one place
 * to change them.
 */
export * from "@/lib/validations/common";
export * from "@/lib/validations/complaint";
export * from "@/lib/validations/image";
export * from "@/lib/validations/auth";