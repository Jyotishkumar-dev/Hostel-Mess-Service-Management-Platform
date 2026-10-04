import "server-only";

import { createTypedServerClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth/session";
import { IMAGE_BUCKET } from "@/lib/complaints/constants";
import { validateImage } from "@/lib/validations/image";
import { resolutionNoteSchema } from "@/lib/validations/complaint";
import { revalidatePath } from "next/cache";

import type { StaffActionState } from "@/lib/staff/state";

const NOT_CONFIGURED =
  "Storage is not connected yet. Add your Supabase keys to .env.local.";

/**
 * Moves the caller's assigned complaint from `assigned` -> `in_progress`
 * (or `reopened` -> `in_progress`).
 *
 * The transition — and the check that the complaint is actually assigned to the
 * caller — is enforced by the `advance_complaint` SECURITY DEFINER function in
 * migration 0003, so a tampered request body cannot operate on a complaint the
 * staff member does not own.
 */
export async function startWorkAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const user = await requireRole("staff");
  const complaintId = formData.get("complaintId")?.toString();

  if (!complaintId) {
    return { status: "error", message: "No issue selected." };
  }

  try {
    const { data: ok, error } = await supabase.rpc("advance_complaint", {
      p_complaint_id: complaintId,
      p_new_status: "in_progress",
      p_note: "Work started",
      p_resolution_image_path: null,
    });

    if (error) {
      console.error("[staff] startWork rpc error:", error.message);
      return {
        status: "error",
        message: "We could not start work on this issue. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message:
          "This issue is not assigned to you, or it is not in a state that can be started.",
      };
    }

    revalidatePath(`/staff/issues/${complaintId}`);
    revalidatePath("/staff/issues");
    return { status: "success", message: "Issue marked as in progress." };
  } catch (error) {
    console.error("[staff] startWork failed:", error);
    return {
      status: "error",
      message: "We could not start work on this issue. Please try again.",
    };
  }
}

/**
 * Resolves the caller's complaint, optionally attaching a resolution photo.
 *
 * The note is validated with Zod on the server (never trusting the client),
 * the photo is validated and uploaded to the private `resolution/` namespace,
 * and only then is `advance_complaint` asked to flip `in_progress -> resolved`.
 * The function re-checks assignment and transition rules, so this is a second
 * authorization boundary, not the only one.
 */
export async function resolveComplaintAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const user = await requireRole("staff");
  const complaintId = formData.get("complaintId")?.toString();
  const note = formData.get("note")?.toString() ?? "";

  if (!complaintId) {
    return { status: "error", message: "No issue selected." };
  }

  // Server-side validation: client checks are convenience, not a boundary.
  const parsed = resolutionNoteSchema.safeParse(note);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fill in the resolution note.",
      fieldErrors: { note: "Resolution note is required." },
    };
  }

  const file =
    formData.get("photo") instanceof File &&
    (formData.get("photo") as File).size > 0
      ? (formData.get("photo") as File)
      : null;

  let resolutionImagePath: string | null = null;

  if (file) {
    const checked = validateImage(file);
    if (!checked.ok) {
      return {
        status: "error",
        message: checked.message,
        fieldErrors: { photo: checked.message },
      };
    }

    // resolution/{staff_id}/{complaint_id}/evidence.{ext}
    // The storage policy keys the second segment off auth.uid(), which here is
    // the caller staff member — so only they can read what they uploaded.
    const path = `resolution/${user.id}/${complaintId}/evidence.${checked.extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[staff] resolution image upload failed:", uploadError.message);
      return {
        status: "error",
        message: "The resolution note was saved, but the photo could not be attached.",
      };
    }

    resolutionImagePath = path;
  }

  try {
    const { data: ok, error } = await supabase.rpc(
      "advance_complaint",
      {
        p_complaint_id: complaintId,
        p_new_status: "resolved",
        p_note: parsed.data,
        p_resolution_image_path: resolutionImagePath,
      },
    );

    if (error) {
      console.error("[staff] resolve rpc error:", error.message);
      return {
        status: "error",
        message: "We could not save the resolution. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message:
          "This issue cannot be resolved right now — it must be in progress and assigned to you.",
      };
    }

    revalidatePath(`/staff/issues/${complaintId}`);
    revalidatePath("/staff/issues");

    return {
      status: "success",
      message: "Issue marked as resolved.",
      complaint: { id: complaintId, reference: "", resolvedAt: null },
    };
  } catch (error) {
    console.error("[staff] resolve failed:", error);
    return {
      status: "error",
      message: "We could not save the resolution. Please try again.",
    };
  }
}
