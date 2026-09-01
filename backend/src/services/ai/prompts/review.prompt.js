// Output is always a *suggested* score, stored separately from the official
// score and requiring admin approval before it counts (spec §18/§48).
export function buildReviewPrompt(submissionContent, rubric = []) {
  const rubricText = rubric.length
    ? rubric.map((r) => `- ${r.criterion} (max ${r.maxScore})`).join("\n")
    : "No formal rubric provided — use general quality judgment.";

  return `You are reviewing a student submission for the Catalyst programme. Evaluate it
against the rubric below and return STRICT JSON only, matching this shape:
{
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[],
  "rubricAnalysis": [{ "criterion": string, "score": number, "maxScore": number, "comment": string }],
  "suggestedScore": number
}

RUBRIC:
${rubricText}

SUBMISSION:
${submissionContent}

This is a SUGGESTED score only — an admin will review and may accept, modify, or
reject it. Be constructive and specific, not just complimentary.`;
}
