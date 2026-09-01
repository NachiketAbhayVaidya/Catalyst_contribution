import { apiClient } from "./client"

export async function getAdminDashboard() {
  return apiClient.get("/admin/dashboard")
}

export async function getAdminStudents(params = {}) {
  return apiClient.get("/admin/students", params)
}

export async function getAdminStudent(studentId) {
  return apiClient.get(`/admin/students/${studentId}`)
}

export async function getAdminCourses(params = {}) {
  return apiClient.get("/admin/courses", params)
}

export async function createCourse(payload) {
  return apiClient.post("/admin/courses", payload)
}

export async function createActivity(payload) {
  return apiClient.post("/admin/activities", payload)
}

export async function getAdminSubmissions(params = {}) {
  return apiClient.get("/admin/submissions", params)
}

export async function reviewSubmission(submissionId, { score, feedback, approvedAiReview }) {
  return apiClient.patch(`/admin/submissions/${submissionId}/review`, { score, feedback, approvedAiReview })
}

export async function getAdminAnalytics(params = {}) {
  return apiClient.get("/admin/analytics", params)
}

export async function createMilestone(payload) {
  return apiClient.post("/admin/milestones", payload)
}

// Admin accounts aren't self-service — this only succeeds when called by an
// already-authenticated admin (backend: POST /auth/register-admin).
export async function createAdmin({ name, email, password, title }) {
  return apiClient.post("/auth/register-admin", { name, email, password, title })
}
