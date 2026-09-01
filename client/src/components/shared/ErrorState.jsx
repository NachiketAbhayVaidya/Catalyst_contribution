import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <AlertTriangle className="size-5 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="text-[13px] text-muted-foreground">{message || "Please try again."}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
