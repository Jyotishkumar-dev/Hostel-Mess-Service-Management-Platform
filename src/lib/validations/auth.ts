import { z } from "zod";
import { requiredParagraph, requiredText } from "@/lib/validations/common";

/**
 * Zod schemas for authentication forms.
 *
 * These are shared between client (React Hook Form) and server (Server Actions)
 * so validation logic is never duplicated.
 */

/** Login: email + password. */
export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const loginDefaults: LoginValues = {
  email: "",
  password: "",
};

/** Signup: full name, email, password, confirm password. */
export const signupSchema = z
  .object({
    fullName: requiredText("Full name", 80),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type SignupValues = z.infer<typeof signupSchema>;

export const signupDefaults: SignupValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};