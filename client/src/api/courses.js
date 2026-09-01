import { apiClient } from "./client"

export async function getCourses(params = {}) {
  return apiClient.get("/courses", params)
}

export async function getCourse(courseId) {
  return apiClient.get(`/courses/${courseId}`)
}

export async function enrollInCourse(courseId) {
  return apiClient.post(`/courses/${courseId}/enroll`)
}
