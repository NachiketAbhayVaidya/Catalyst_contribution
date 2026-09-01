import { apiClient, USE_MOCK, mockDelay } from "./client"
import { mockUsers, mockXp, mockStreak, mockTeam, mockCourses } from "./mockData"

const CURRENT_USER_ID = "usr_123"

function currentUser() {
  return mockUsers[CURRENT_USER_ID]
}

export async function getDashboard() {
  return apiClient.get("/student/dashboard")
}

export async function getProfile() {
  if (USE_MOCK) {
    const user = currentUser()
    return mockDelay({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      level: mockXp.level,
      xp: mockXp.totalXP,
      rank: 14,
      currentStreak: mockStreak.currentStreak,
      longestStreak: mockStreak.longestStreak,
      completionPercentage: 68,
      team: { id: mockTeam.id, name: mockTeam.name },
    })
  }
  return apiClient.get("/student/profile")
}

export async function getProgress() {
  if (USE_MOCK) {
    return mockDelay({
      overall: { completionPercentage: 68, xp: mockXp.totalXP, level: mockXp.level },
      courses: mockCourses
        .filter((c) => c.enrolled)
        .map((c) => ({
          id: c.id,
          title: c.title,
          progress: c.progress,
          completedModules: c.modules.filter((m) => m.completed).length,
          totalModules: c.modules.length,
        })),
      yearProgress: { year: 2, percentage: 54 },
      milestones: [],
    })
  }
  return apiClient.get("/student/progress")
}

export async function getActivities(params = {}) {
  return apiClient.get("/student/activities", params)
}

export async function getActivity(activityId) {
  return apiClient.get(`/activities/${activityId}`)
}
