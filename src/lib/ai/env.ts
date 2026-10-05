/**
 * AI environment configuration.
 *
 * `GEMINI_API_KEY` is server-side only — it is read from `process.env` at
 * runtime and is never exposed to the browser. Never reference it through a
 * `NEXT_PUBLIC_*` variable.
 */

let keyCache: string | undefined;

/** Get the Gemini API key (undefined when not configured). */
export function getGeminiKey(): string | undefined {
  if (keyCache !== undefined) return keyCache;
  keyCache = process.env.GEMINI_API_KEY?.trim();
  if (keyCache === "") keyCache = undefined;
  return keyCache;
}

/** True when a Gemini API key is present. */
export function isAiConfigured(): boolean {
  return Boolean(getGeminiKey());
}
