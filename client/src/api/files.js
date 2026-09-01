import { apiClient } from "./client"

export async function uploadFile(file, purpose) {
  const formData = new FormData()
  formData.append("file", file)
  if (purpose) formData.append("purpose", purpose)
  return apiClient.upload("/files/upload", formData)
}
