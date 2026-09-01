import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/apierror.js";

let client = null;

function getModel() {
  if (!env.ai.geminiApiKey) {
    throw new ApiError(503, "AI Coach is not configured (missing GEMINI_API_KEY)");
  }
  if (!client) {
    client = new GoogleGenerativeAI(env.ai.geminiApiKey);
  }
  return client.getGenerativeModel({ model: env.ai.geminiModel });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini's newer models frequently return a transient 503 ("high demand") —
// one retry with a short backoff turns that from a user-facing failure into
// a ~1s delay, without masking a genuinely broken request (e.g. bad model name).
async function withRetry(fn) {
  try {
    return await fn();
  } catch (error) {
    const isTransient = /503|overloaded|high demand/i.test(error?.message ?? "");
    if (!isTransient) throw error;
    await sleep(1000);
    return fn();
  }
}

// Thin transport wrapper — no prompt construction or business logic here.
// That lives in ai.service.js / prompts/*, so swapping providers only means
// implementing this same generateText/generateJson surface.
export const GeminiProvider = {
  async generateText(prompt) {
    const model = getModel();
    const result = await withRetry(() => model.generateContent(prompt));
    return result.response.text();
  },

  async generateJson(prompt) {
    const model = getModel();
    const result = await withRetry(() =>
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    );
    const text = result.response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ApiError(502, "AI provider returned an unparseable response");
    }
  },
};
