"use server";

import "server-only";

import { createTypedServerClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth/session";
import { IMAGE_BUCKET } from "@/lib/complaints/constants";
import {
  complaintSchema,
  complaintImagePath,
  validateImage,
} from "@/lib/validations";
import { runAiAnalysis } from "@/lib/complaints/ai";
import type { ComplaintActionState } from "@/lib/complaints/state";

/**
 * Creates a complaint from the student submission form.
 *
 * Follows the same `(_prevState, formData) => state` shape as the auth actions
 * so the form can use `useActionState`.
 *
 * SECURITY: the owner, status and priority are never read from the form. The
 * user id comes from the session and the other two are assigned by the
 * `complaints_protect_on_insert` database trigger, so a tampered request body
 * cannot file a complaint as somebody else or pre-set it to "resolved".
 */

const NOT_CONFIGURED =
  "Feedback storage is not connected yet. Add your Supabase keys to .env.local to submit feedback.";

export async function createComplaintAction(
  _previousState: ComplaintActionState,
  formData: FormData,
): Promise<ComplaintActionState> {
  const supabase = await createTypedServerClient();

  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  // requireUser() throws a redirect when signed out, which is the correct
  // response: an anonymous caller should never reach the database.
  const user = await requireUser();

  const parsed = complaintSchema.safeParse({
    serviceType: formData.get("serviceType"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const values = parsed.data;

  // The file is optional. Validate it before the insert so an invalid photo
  // never produces an orphaned complaint row.
  const photo = formData.get("photo");
  const file = photo instanceof File && photo.size > 0 ? photo : null;

  let upload: { path: string; extension: string } | null = null;

  if (file) {
    const checked = validateImage(file);
    if (!checked.ok) {
      return {
        status: "error",
        message: checked.message,
        fieldErrors: { photo: checked.message },
      };
    }
    upload = { path: "", extension: checked.extension };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("complaints")
    .insert({
      service_type: values.serviceType,
      category: values.category,
      title: values.title,
      description: values.description,
      location: values.location,
    })
    .select("id, reference, status, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[complaints] insert failed:", insertError?.message);
    return {
      status: "error",
      message:
        "We could not save your feedback. Please try again in a moment.",
    };
  }

  if (upload && file) {
    const folder = complaintImagePath(user.id, inserted.id);
    const path = `${folder}/evidence.${upload.extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        // Never let a browser decide whether a previously uploaded object can be
        // replaced; each complaint gets its own folder, so this is always new.
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      // The complaint itself is valid and saved, so it is kept — losing the text
      // a student carefully typed in because a photo failed would be worse than
      // a complaint without evidence.
      console.error("[complaints] image upload failed:", uploadError.message);
      return {
        status: "error",
        message: `Your feedback was saved (${inserted.reference}) but the photo could not be attached. You can view it from your complaints list.`,
        complaint: {
          id: inserted.id,
          reference: inserted.reference,
          status: inserted.status,
          createdAt: inserted.created_at,
        },
      };
    }

    // Students have no UPDATE policy on `complaints`, so linking the photo goes
    // through a SECURITY DEFINER function that can only set image_path on the
    // caller's own row. See `attach_complaint_image` in migration 0002.
    const { data: linked, error: linkError } = await supabase.rpc(
      "attach_complaint_image",
      { target_complaint_id: inserted.id, target_image_path: path },
    );

    if (linkError || !linked) {
      // The object is stored but unlinked. Log it loudly: the row is orphaned and
      // needs a lifecycle rule to clean up, which Phase 4 will add.
      console.error("[complaints] image link failed:", linkError?.message);
    }
  }

  try {
    // Fire-and-forget AI analysis. It must not prevent the student from seeing
    // the success response, so we never await it here — a failure is recorded
    // inside `runAiAnalysis` and surfaced later in the admin UI.
    void runAiAnalysis(supabase, inserted.id);
  } catch (error) {
    console.error("[complaints] ai trigger failed:", error);
  }

  return {
    status: "success",
    complaint: {
      id: inserted.id,
      reference: inserted.reference,
      status: inserted.status,
      createdAt: inserted.created_at,
    },
  };
}

/** Flattens a Zod error into one message per field, matching the auth actions. */
function fieldErrorsFrom(error: {
  flatten(): { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [field, messages] of Object.entries(error.flatten().fieldErrors)) {
    if (messages && messages[0]) flattened[field] = messages[0];
  }

  return flattened;
}