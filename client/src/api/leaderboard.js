import { apiClient, USE_MOCK, mockDelay } from "./client"
import { mockLeaderboard } from "./mockData"

export async function getLeaderboard(params = {}) {
  if (USE_MOCK) {
    // scope/period params would slice a real dataset differently; the mock
    // returns the same ranked list regardless, which is enough to drive the UI.
    return mockDelay(mockLeaderboard)
  }
  return apiClient.get("/leaderboard", params)
}
