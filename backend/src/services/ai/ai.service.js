import { GeminiProvider } from "./providers/gemini.provider.js";
import { buildCoachPrompt } from "./prompts/coach.prompt.js";
import { buildReviewPrompt } from "./prompts/review.prompt.js";
import { buildQuizGenerationPrompt } from "./prompts/quiz.prompt.js";
import { buildNudgePrompt } from "./prompts/nudge.prompt.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/apierror.js";
import { AI_PROVIDERS } from "../../constants.js";

// Provider-agnostic surface (spec §29/§47). Swapping AI_PROVIDER env var to a
// new value + adding a provider module here is the only change needed to
// switch providers — no other file should import Gemini directly.
const PROVIDERS = {
  [AI_PROVIDERS.GEMINI]: GeminiProvider,
};

function getProvider() {
  const provider = PROVIDERS[env.ai.provider];
  if (!provider) {
    throw new ApiError(500, `Unsupported AI_PROVIDER: ${env.ai.provider}`);
  }
  return provider;
}

export const AIService = {
  async chatWithCoach(studentContext, message, history = []) {
    const prompt = buildCoachPrompt(studentContext, message, history);
    return getProvider().generateText(prompt);
  },

  async reviewSubmission(submissionContent, rubric = []) {
    const prompt = buildReviewPrompt(submissionContent, rubric);
    return getProvider().generateJson(prompt);
  },

  async generateQuizQuestions({ courseTitle, moduleTitle, difficulty, topic, numQuestions }) {
    const prompt = buildQuizGenerationPrompt({ courseTitle, moduleTitle, difficulty, topic, numQuestions });
    return getProvider().generateJson(prompt);
  },

  async generateNudge(studentContext, situation) {
    const prompt = buildNudgePrompt(studentContext, situation);
    return getProvider().generateText(prompt);
  },

  // Recommendation reuses the coach prompt with a fixed, framing question —
  // kept as a distinct method per spec §47 so callers don't have to know that.
  async generateRecommendation(studentContext) {
    return this.chatWithCoach(studentContext, "What should I focus on next, and why?");
  },

  async generateFeedback(studentContext) {
    return this.chatWithCoach(
      studentContext,
      "Summarize my recent progress and give me constructive feedback.",
    );
  },
};
