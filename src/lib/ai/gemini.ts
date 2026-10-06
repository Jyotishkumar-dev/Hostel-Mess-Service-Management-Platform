import "server-only";

import { GoogleGenAI } from "@google/genai";
import { aiSuggestionSchema, type AiSuggestion, type AiInput } from "./schema";
import { SYSTEM_PROMPT, buildUserMessage, AI_MODEL } from "./prompt";
import { getGeminiKey } from "./env";

/**
 * Asks Gemini to analyse a single complaint.
 *
 * Returns `{ ok: true, data }` on a schema-valid response, or
 * `{ ok: false, error }` when the key is absent, the model call fails, or the
 * model returned something the Zod schema rejects. Never throws: callers treat
 * a failure as "mark analysis failed" and keep the complaint alive.
 */
export async function analyzeComplaint(
  input: AiInput,
): Promise<{ ok: true; data: AiSuggestion } | { ok: false; error: string }> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    return { ok: false, error: "Gemini API key is not configured." };
  }

  const client = new GoogleGenAI({ apiKey });

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "user", parts: [{ text: buildUserMessage(input) }] },
  ];

  try {
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: undefined,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { ok: false, error: "Gemini returned an empty response." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "Gemini returned a non-JSON response." };
    }

    const result = aiSuggestionSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[ai] schema validation failed:", result.error);
      return { ok: false, error: "AI response did not match the expected schema." };
    }

    return { ok: true, data: result.data };
  } catch (error) {
    console.error("[ai] analyzeComplaint failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gemini request failed unexpectedly.",
    };
  }
}
