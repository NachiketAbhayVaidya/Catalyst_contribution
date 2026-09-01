import { cn } from "@/lib/utils"

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-20 text-center", className)}>
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
