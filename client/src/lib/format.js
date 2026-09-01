export function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatDueLabel(iso) {
  if (!iso) return null
  const due = new Date(iso)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`
  if (diffDays === 0) return "Due today"
  if (diffDays === 1) return "Due tomorrow"
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return `Due ${formatDate(iso)}`
}

export function formatNumber(n) {
  if (n === null || n === undefined) return "—"
  return n.toLocaleString()
}

export function statusLabel(status) {
  if (!status) return ""
  return status.replaceAll("_", " ").toLowerCase()
}

export function typeLabel(type) {
  if (!type) return ""
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}
