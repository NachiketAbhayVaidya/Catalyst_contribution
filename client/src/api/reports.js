import { apiClient, saveBlob } from "./client"

// Dropdown contents for the filter panel plus the report catalog, which says
// which filters each report actually honours.
export async function getReportOptions() {
  return apiClient.get("/admin/reports/options")
}

export async function generateReport(params) {
  return apiClient.get("/admin/reports", params)
}

// Same filters, same rows, no pagination — streams straight to a file.
// Returns the row cap when the backend had to truncate, so the caller can warn.
export async function exportReportCsv(params) {
  const { blob, filename, truncatedAt } = await apiClient.download("/admin/reports/export", { params })
  saveBlob(blob, filename)
  return { filename, truncatedAt: truncatedAt ? Number(truncatedAt) : null }
}
