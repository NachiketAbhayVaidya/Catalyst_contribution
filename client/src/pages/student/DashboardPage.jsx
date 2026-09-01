import { Link, useNavigate } from "react-router-dom"
import {
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Users2,
  CalendarDays,
  Award,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useFetch } from "@/hooks/use-fetch"
import { getDashboard } from "@/api/student"
import { formatDueLabel, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { ListRow } from "@/components/shared/ListRow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const ACTIVITY_ICONS = {
  ASSIGNMENT: ClipboardList,
  QUIZ: Target,
  TRAINING_SESSION: CalendarDays,
  MENTORING: Users2,
  COACHING: Users2,
  PROJECT: BookOpen,
  RESEARCH: BookOpen,
  MILESTONE: Award,
  COMPETITION: Trophy,
  COURSE: BookOpen,
  CUSTOM: ClipboardList,
}

function activityHref(activity) {
  if (activity.type === "ASSIGNMENT") return `/assignments/${activity.linkedId || activity.id}`
  if (activity.type === "QUIZ") return `/quizzes/${activity.linkedId || activity.id}`
  return `/activities/${activity.id}`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => getDashboard(), [])
  const d = data?.data

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(" ")[0] || "there"}. Here's where you stand today.`}
      />

      {/* AI Coach callout */}
      {loading ? (
        <Skeleton className="mb-6 h-24 w-full rounded-lg" />
      ) : (
        d?.aiCoach && (
          <Card className="mb-6 border-primary/20 bg-accent/40">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="size-4 text-primary-foreground" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Your AI coach</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{d.aiCoach.message}</p>
                </div>
              </div>
              {d.aiCoach.recommendedAction && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  nativeButton={false}
                  render={
                    <Link
                      to={activityHref({
                        type: d.aiCoach.recommendedAction.type,
                        id: d.aiCoach.recommendedAction.id,
                        linkedId: d.aiCoach.recommendedAction.id,
                      })}
                    />
                  }
                >
                  {d.aiCoach.recommendedAction.title}
                  <ArrowRight className="size-3.5" strokeWidth={1.75} />
                </Button>
              )}
            </CardContent>
          </Card>
        )
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCard loading />
            <StatCard loading />
            <StatCard loading />
            <StatCard loading />
          </>
        ) : (
          <>
            <StatCard label="Total XP" value={d.stats.xp.toLocaleString()} icon={Trophy} primary />
            <StatCard label="Level" value={d.stats.level} icon={Target} />
            <StatCard label="Current streak" value={`${d.stats.currentStreak} days`} icon={Flame} />
            <StatCard label="Completion" value={`${d.stats.completionPercentage}%`} icon={CheckCircle2} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming activities */}
        <Card className="p-0 lg:col-span-2">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Upcoming activities</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 divide-y divide-border px-0">
            {loading ? (
              <div className="space-y-4 px-6 py-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : d.upcomingActivities.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No upcoming activities"
                description="You're all caught up. Check back later."
              />
            ) : (
              d.upcomingActivities.map((activity) => (
                <ListRow
                  key={activity.id}
                  icon={ACTIVITY_ICONS[activity.type] || ClipboardList}
                  title={activity.title}
                  subtitle={typeLabel(activity.type)}
                  onClick={() => navigate(activityHref(activity))}
                  right={
                    <span className="text-xs text-muted-foreground">{formatDueLabel(activity.dueDate) || "No due date"}</span>
                  }
                />
              ))
            )}
          </CardContent>
          {!loading && d?.upcomingActivities.length > 0 && (
            <div className="border-t border-border px-6 py-3">
              <Link to="/activities" className="text-sm font-medium text-primary hover:underline">
                View all activities
              </Link>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          {/* Current mission */}
          <Card>
            <CardHeader>
              <CardTitle>This week's mission</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : d.currentMission ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{d.currentMission.title}</p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (d.currentMission.progress.completed / d.currentMission.progress.required) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.currentMission.progress.completed} of {d.currentMission.progress.required} tasks complete
                  </p>
                  <Link to="/missions" className="inline-block text-sm font-medium text-primary hover:underline">
                    View mission
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active mission right now.</p>
              )}
            </CardContent>
          </Card>

          {/* Next milestone */}
          <Card>
            <CardHeader>
              <CardTitle>Next milestone</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-12 w-full" />
              ) : d.nextMilestone ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{d.nextMilestone.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {d.nextMilestone.progress.toLocaleString()} / {d.nextMilestone.target.toLocaleString()} XP
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (d.nextMilestone.progress / d.nextMilestone.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming milestone.</p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard preview */}
          <Card className="p-0">
            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="mt-3 divide-y divide-border px-0">
              {loading ? (
                <div className="space-y-3 px-6 py-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                d.leaderboardPreview.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between px-6 py-2.5 text-sm ${
                      entry.student.id === user?.id ? "bg-accent/50 font-medium" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="w-4 text-xs text-muted-foreground tabular-nums">#{entry.rank}</span>
                      {entry.student.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{entry.xp.toLocaleString()} XP</span>
                  </div>
                ))
              )}
            </CardContent>
            <div className="border-t border-border px-6 py-3">
              <Link to="/leaderboard" className="text-sm font-medium text-primary hover:underline">
                View full leaderboard
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
