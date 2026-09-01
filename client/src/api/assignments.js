import { apiClient } from "./client"

export async function getAssignment(assignmentId) {
  return apiClient.get(`/assignments/${assignmentId}`)
}

export async function getSubmissions(assignmentId) {
  return apiClient.get(`/assignments/${assignmentId}/submissions`)
}

export async function submitAssignment(assignmentId, payload) {
  return apiClient.post(`/assignments/${assignmentId}/submit`, payload)
}

export async function getSubmissionReview(submissionId) {
  return apiClient.get(`/submissions/${submissionId}/review`)
}
