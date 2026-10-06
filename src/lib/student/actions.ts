"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth/session";

import type { StudentActionState } from "./state";

const NOT_CONFIGURED =
  "Storage is not connected yet. Add your Supabase keys to .env.local.";

/**
 * Student confirms that a resolved complaint is actually fixed.
 *
 * Calls the `student_verify_resolution` SECURITY DEFINER function, which
 * enforces:
 *   - caller owns the complaint
 *   - status = 'resolved'
 *   - verification_status = 'pending'
 */
export async function verifyResolutionAction(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const user = await requireUser();

  const complaintId = formData.get("complaintId")?.toString();
  if (!complaintId) {
    return { status: "error", message: "No complaint selected." };
  }

  try {
    const { data: ok, error } = await supabase.rpc(
      "student_verify_resolution",
      { p_complaint_id: complaintId },
    );

    if (error) {
      console.error("[student] verify failed:", error.message);
      return {
        status: "error",
        message: "We could not record your verification. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message:
          "This complaint cannot be verified right now. It may have already been verified or is not in the resolved state.",
      };
    }

    revalidatePath(`/student/complaints/${complaintId}`);
    revalidatePath("/student/complaints");
    revalidatePath("/student");
    return { status: "success", message: "Thank you for confirming the resolution." };
  } catch (error) {
    console.error("[student] verify failed:", error);
    return {
      status: "error",
      message: "We could not record your verification. Please try again.",
    };
  }
}

/**
 * Student rejects a resolution and provides a reopen reason.
 *
 * Calls the `student_reject_resolution` SECURITY DEFINER function, which
 * enforces:
 *   - caller owns the complaint
 *   - status = 'resolved'
 *   - verification_status = 'pending'
 *   - reopen_reason is at least 10 characters
 */
export async function rejectResolutionAction(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const user = await requireUser();

  const complaintId = formData.get("complaintId")?.toString();
  const reopenReason = formData.get("reopenReason")?.toString();

  if (!complaintId) {
    return { status: "error", message: "No complaint selected." };
  }

  if (!reopenReason || reopenReason.trim().length < 10) {
    return {
      status: "error",
      message: "Please explain what is still wrong (at least 10 characters).",
      fieldErrors: { reopenReason: "Please provide at least 10 characters." },
    };
  }

  try {
    const { data: ok, error } = await supabase.rpc(
      "student_reject_resolution",
      {
        p_complaint_id: complaintId,
        p_reopen_reason: reopenReason.trim(),
      },
    );

    if (error) {
      console.error("[student] reject failed:", error.message);
      return {
        status: "error",
        message: "We could not record your feedback. Please try again.",
      };
    }

    if (!ok) {
      return {
        status: "error",
        message:
          "This complaint cannot be reopened right now. It may have already been verified or is not in the resolved state.",
      };
    }

    revalidatePath(`/student/complaints/${complaintId}`);
    revalidatePath("/student/complaints");
    revalidatePath("/student");
    return { status: "success", message: "The complaint has been reopened." };
  } catch (error) {
    console.error("[student] reject failed:", error);
    return {
      status: "error",
      message: "We could not record your feedback. Please try again.",
    };
  }
}

/**
 * Student submits optional resolution feedback (rating + comment) after
 * verifying a resolution.
 */
export async function submitResolutionFeedbackAction(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const supabase = await createTypedServerClient();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const user = await requireUser();

  const complaintId = formData.get("complaintId")?.toString();
  const rating = formData.get("rating")?.toString();
  const comment = formData.get("comment")?.toString();

  if (!complaintId) {
    return { status: "error", message: "No complaint selected." };
  }

  const ratingNumber = rating ? parseInt(rating, 10) : null;
  if (ratingNumber !== null && (ratingNumber < 1 || ratingNumber > 5)) {
    return {
      status: "error",
      message: "Rating must be between 1 and 5.",
      fieldErrors: { rating: "Must be 1–5." },
    };
  }

  const trimmedComment = comment?.trim() ?? null;
  if (trimmedComment && trimmedComment.length > 500) {
    return {
      status: "error",
      message: "Feedback must be 500 characters or fewer.",
      fieldErrors: { comment: "Maximum 500 characters." },
    };
  }

  try {
    const { error } = await supabase
      .from("complaints")
      .update({
        resolution_rating: ratingNumber,
        resolution_feedback: trimmedComment,
      })
      .eq("id", complaintId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[student] feedback failed:", error.message);
      return {
        status: "error",
        message: "We could not save your feedback. Please try again.",
      };
    }

    revalidatePath(`/student/complaints/${complaintId}`);
    return { status: "success", message: "Thank you for your feedback." };
  } catch (error) {
    console.error("[student] feedback failed:", error);
    return {
      status: "error",
      message: "We could not save your feedback. Please try again.",
    };
  }
}
