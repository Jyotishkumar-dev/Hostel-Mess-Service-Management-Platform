/**
 * Shared constants for the complaint feature.
 *
 * Kept in their own module so both the Server Action and the read queries can
 * use them without importing each other.
 */

/**
 * Private Supabase Storage bucket that holds complaint photos.
 * Created by migration 0002 — the name here must match that migration.
 */
export const IMAGE_BUCKET = "complaint-images";

/**
 * How long a signed image URL stays valid.
 *
 * Ten minutes is enough to open a details page and read the photo, and short
 * enough that a copied link stops working shortly after.
 */
export const IMAGE_URL_TTL_SECONDS = 60 * 10;