import { apiClient } from "./client"

export async function sendCoachMessage({ message, conversationId }) {
  return apiClient.post("/ai/coach", { message, conversationId })
}

export async function getConversations() {
  return apiClient.get("/ai/conversations")
}

export async function getConversation(conversationId) {
  return apiClient.get(`/ai/conversations/${conversationId}`)
}
