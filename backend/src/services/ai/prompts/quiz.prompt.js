export function buildQuizGenerationPrompt({ courseTitle, moduleTitle, difficulty, topic, numQuestions }) {
  return `Generate ${numQuestions} quiz questions for the Catalyst learning programme.
Course: ${courseTitle}
Module: ${moduleTitle ?? "N/A"}
Topic: ${topic}
Difficulty: ${difficulty}

Return STRICT JSON only: an array of objects shaped like:
{
  "type": "multiple_choice" | "multiple_select" | "true_false" | "short_answer" | "scenario",
  "prompt": string,
  "options": [{ "text": string, "isCorrect": boolean }],
  "correctShortAnswer": string | null,
  "points": number
}
For "short_answer" type, options must be an empty array and correctShortAnswer must be set.
For all other types, correctShortAnswer must be null.`;
}
