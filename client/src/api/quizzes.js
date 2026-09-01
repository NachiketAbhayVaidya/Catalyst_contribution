import { apiClient, USE_MOCK, mockDelay, mockError } from "./client"
import { mockQuizzes, mockQuizQuestions, nextId } from "./mockData"

export async function getQuiz(quizId) {
  if (USE_MOCK) {
    const quiz = mockQuizzes[quizId]
    if (!quiz) return mockError("NOT_FOUND", "Quiz not found.", 404)
    return mockDelay(quiz)
  }
  return apiClient.get(`/quizzes/${quizId}`)
}

export async function startQuiz(quizId) {
  if (USE_MOCK) {
    const quiz = mockQuizzes[quizId]
    const questions = mockQuizQuestions[quizId]
    if (!quiz || !questions) return mockError("NOT_FOUND", "Quiz not found.", 404)
    const startedAt = new Date()
    const expiresAt = new Date(startedAt.getTime() + quiz.timeLimitSeconds * 1000)
    return mockDelay({
      attemptId: nextId("attempt"),
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      questions,
    })
  }
  return apiClient.get(`/quizzes/${quizId}/start`)
}

export async function submitQuiz(quizId, { attemptId, answers }) {
  if (USE_MOCK) {
    const questions = mockQuizQuestions[quizId] || []
    const quiz = mockQuizzes[quizId]
    // Mock scoring: deterministic-but-plausible, since we never ship correct answers to the client.
    const correctAnswers = Math.max(1, Math.round(questions.length * 0.8))
    const score = Math.round((correctAnswers / questions.length) * 100)
    const xpEarned = Math.round((quiz?.xpReward || 0) * (correctAnswers / questions.length))
    return mockDelay({
      attemptId,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      xpEarned,
    }, 500)
  }
  return apiClient.post(`/quizzes/${quizId}/submit`, { attemptId, answers })
}
