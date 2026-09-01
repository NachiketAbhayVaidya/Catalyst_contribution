// One short, non-spammy nudge (spec §19) — never a full report.
export function buildNudgePrompt(context, situation) {
  return `You are the Catalyst AI Coach generating a single short, encouraging nudge
notification for a student. Use ONLY the context below as fact.

SITUATION: ${situation}

STUDENT CONTEXT (JSON):
${JSON.stringify(context, null, 2)}

Write ONE short sentence (under 25 words), positive in tone, specific to the
situation and context. No preamble, just the nudge text.`;
}
