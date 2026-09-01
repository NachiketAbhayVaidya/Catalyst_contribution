import { apiClient, USE_MOCK, mockDelay } from "./client"
import { mockXp, mockAchievements, mockStreak, mockMission, mockTeam, mockCompetition } from "./mockData"

// Note per contract §59/§61: the frontend never calls an endpoint that lets a
// student award themselves XP directly — these are all read-only.

export async function getXp() {
  if (USE_MOCK) return mockDelay(mockXp)
  return apiClient.get("/student/xp")
}

export async function getAchievements() {
  if (USE_MOCK) return mockDelay(mockAchievements)
  return apiClient.get("/student/achievements")
}

export async function getMilestones() {
  return apiClient.get("/student/milestones")
}

export async function getStreak() {
  if (USE_MOCK) return mockDelay(mockStreak)
  return apiClient.get("/student/streak")
}

export async function getCurrentMission() {
  if (USE_MOCK) return mockDelay(mockMission)
  return apiClient.get("/missions/current")
}

export async function getTeam() {
  if (USE_MOCK) return mockDelay(mockTeam)
  return apiClient.get("/student/team")
}

export async function getCurrentCompetition() {
  if (USE_MOCK) return mockDelay(mockCompetition)
  return apiClient.get("/competitions/current")
}
