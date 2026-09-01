import { CheckCircle2, Circle, Target, Zap } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getCurrentMission } from "@/api/gamification"
import { formatDate } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MissionsPage() {
  const { data, loading, error, refetch } = useFetch(() => getCurrentMission(), [])
  const mission = data?.data

  return (
    <div>
      <PageHeader title="Missions" subtitle="Your current weekly challenge." />

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : loading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : !mission ? (
        <Card>
          <EmptyState icon={Target} title="No active mission" description="Check back soon for a new challenge." />
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">{mission.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mission.description}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
                <Zap className="size-4" strokeWidth={1.75} />
                {mission.xpReward} XP
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {mission.progress.completed} of {mission.progress.required} tasks complete
                </span>
                <span>Ends {formatDate(mission.endDate)}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (mission.progress.completed / mission.progress.required) * 100)}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-border border-t border-border pt-2">
              {mission.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-3">
                  {task.completed ? (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" strokeWidth={1.75} />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  )}
                  <span className={`text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
