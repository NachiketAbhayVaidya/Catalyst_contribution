import { apiClient } from "./client"

export async function getSessions(params = {}) {
  return apiClient.get("/sessions", params)
}

export async function registerForSession(sessionId) {
  return apiClient.post(`/sessions/${sessionId}/register`)
}
