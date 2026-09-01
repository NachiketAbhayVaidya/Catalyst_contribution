import { cn } from "@/lib/utils"

export function ListRow({ icon: Icon, title, subtitle, right, onClick, className }) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
        className
      )}
    >
      {Icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </Comp>
  )
}
