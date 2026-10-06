import { AI_DEPARTMENTS, type AiInput } from "./schema";
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from "@/types/complaint";

/**
 * Returns a stable, deduplicated list of the category *values* the model may
 * pick, joined for readability inside the prompt. Built from the single source
 * of truth in `@/types/complaint` so the allowed list never drifts.
 */
function categoryList() {
  return [...new Set(COMPLAINT_CATEGORIES)].join(", ");
}

function priorityList() {
  return COMPLAINT_PRIORITIES.join(", ");
}

function departmentList() {
  return AI_DEPARTMENTS.join(", ");
}

/**
 * System prompt for the AI.
 *
 * Pinned in a dedicated server module so the prompt stays in one place — never
 * scattered across React components. The model is instructed to be an
 * operations assistant that never invents facts and only ever returns the
 * controlled vocabularies above.
 */
export const SYSTEM_PROMPT = `You are a University Hostel & Mess Service Operations Assistant.

Your job is to help administrators triage student complaints. For each complaint you will:

1. Suggest the most appropriate category.
2. Suggest an operational priority and a short reason.
3. Write a concise, factual summary that preserves the location and what is wrong.
4. Suggest the responsible department.
5. Detect whether the complaint likely duplicates an existing open report.

Constraints you MUST follow:

- NEVER invent facts. Only use what is stated in the complaint text and the
  candidate list. If something is uncertain, lower the confidence.
- Category must be one of: ${categoryList()}
- Priority must be one of: ${priorityList()}
- Department must be one of: ${departmentList()}
- Confidence is a number between 0 and 1.
- duplicate_complaint_id must be the id of a candidate you judge to be a real
  duplicate, or null if none matches. Only mark a duplicate when the location
  AND the problem are the same, and only ever point at a candidate from the
  list provided — never invent an id.
- Return ONLY the JSON object described below. Do not add commentary, headers
  or markdown fences.

Output schema (JSON):
{
  "category": "water",
  "priority": "high",
  "priority_reason": "Affects access to drinking water for many residents.",
  "summary": "Drinking water cooler not working on the third floor of Block B.",
  "department": "Hostel Maintenance",
  "duplicate_candidate": false,
  "duplicate_complaint_id": null,
  "duplicate_reason": null,
  "confidence": 0.91
}
`;

/** Builds the single user message — the complaint plus the candidate list. */
export function buildUserMessage(input: AiInput): string {
  const candidateBlock = input.candidates
    .map(
      (c) =>
        `  - id=${c.id} | ${c.status} | ${c.area}/${c.category} | "${c.title}" | ${c.location}`,
    )
    .join("\n") || "  (none)";

  return `Complaint to analyse:
service_type: ${input.serviceType}
category (student-selected, may be wrong): ${input.category ?? "unspecified"}
title: ${input.title}
description: ${input.description}
location: ${input.location}

Recent open / in-progress complaints to compare against (avoid inventing ids; only match an entry below):
${candidateBlock}

Return the JSON object now.`;
}

export const AI_MODEL = "gemini-2.0-flash";
