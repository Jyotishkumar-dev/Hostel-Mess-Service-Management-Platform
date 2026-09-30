import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and de-duplicates conflicting Tailwind utilities.
 * This is the single class-name helper used across the whole application.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
