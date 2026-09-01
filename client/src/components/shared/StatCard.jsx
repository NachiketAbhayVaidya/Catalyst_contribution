import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatCard({ label, value, icon: Icon, primary = false, loading = false, className }) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="size-9 rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <p className="font-heading text-[28px] leading-none font-bold tabular-nums text-foreground">{value}</p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              primary ? "bg-accent" : "bg-muted"
            )}
          >
            <Icon className={cn("size-4", primary ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
