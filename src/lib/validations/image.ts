import { z } from "zod";

/**
 * Photo upload rules for complaint evidence.
 *
 * The identical limits are configured on the `complaint-images` storage bucket
 * in migration 0002, so a file that passes here is a file Supabase will also
 * accept. Client-side checks give the student an instant answer; the bucket
 * limits are the real boundary.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";

/** 1048576 -> "1.0 MB" */
function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File extensions a stored object is allowed to use. */
const SAFE_EXTENSION = /\.(jpg|jpeg|png|webp|gif)$/i;

/** Mime type -> the extension we persist. Never trust the original name. */
const EXTENSION_FOR_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Validates a File/Blob and returns the extension to store it under.
 * Returns a human readable reason instead of throwing on failure.
 */
export function validateImage(
  file: Pick<File, "type" | "size" | "name">,
):
  | { ok: true; extension: string }
  | { ok: false; message: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return {
      ok: false,
      message: "Only JPG, PNG, WebP or GIF photos can be attached.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: `That photo is ${formatMb(file.size)}. The limit is 5 MB — try a smaller image.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, message: "That file appears to be empty." };
  }

  return { ok: true, extension: EXTENSION_FOR_TYPE[file.type] };
}

/**
 * Builds the storage object path for a complaint photo.
 *
 * Shape: complaints/{user_id}/{complaint_id}/{filename}
 *
 * The user_id folder is what the storage RLS policies key off, so this layout
 * is a security requirement, not just tidiness. Do not change it without
 * updating the `complaint_images_*` policies in migration 0002.
 */
export function complaintImagePath(userId: string, complaintId: string) {
  return `complaints/${userId}/${complaintId}`;
}

/**
 * Final guard before a file is written to storage.
 *
 * Re-checked server-side: the extension is derived from the detected mime type
 * rather than the filename a client supplied, so a crafted `name` cannot write
 * something outside the allow-list.
 */
export const imageUploadSchema = z.object({
  type: z.enum(ACCEPTED_IMAGE_TYPES, {
    error: "Only JPG, PNG, WebP or GIF photos can be attached.",
  }),
  extension: z.string().regex(SAFE_EXTENSION, "Unsupported image file type."),
});