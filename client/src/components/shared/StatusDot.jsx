import { cn } from "@/lib/utils"

const POSITIVE_STATUSES = new Set(["ACTIVE", "COMPLETED", "REVIEWED", "CONFIRMED"])

function formatLabel(status) {
  return status.replaceAll("_", " ").toLowerCase()
}

export function StatusDot({ status, label, className }) {
  const isPositive = POSITIVE_STATUSES.has(status)
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-foreground", className)}>
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", isPositive ? "bg-primary" : "bg-[#D4C4AD]")}
      />
      {label || formatLabel(status)}
    </span>
  )
}
