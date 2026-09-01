import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardList,
  Target,
  CalendarDays,
  Users2,
  BookOpen,
  Award,
  Trophy,
} from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getActivities } from "@/api/student"
import { formatDueLabel, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { ListRow } from "@/components/shared/ListRow"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TYPE_OPTIONS = [
  "TRAINING_SESSION", "COURSE", "MENTORING", "COACHING", "PROJECT",
  "ASSIGNMENT", "QUIZ", "RESEARCH", "MILESTONE", "COMPETITION", "CUSTOM",
]
const STATUS_OPTIONS = [
  "NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "COMPLETED", "OVERDUE", "CANCELLED", "PENDING",
]

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

export default function ActivitiesPage() {
  const navigate = useNavigate()
  const [type, setType] = useState("ALL")
  const [status, setStatus] = useState("ALL")

  const { data, loading, error, refetch } = useFetch(
    () => getActivities({ limit: 50, type: type === "ALL" ? undefined : type, status: status === "ALL" ? undefined : status, sortBy: "dueDate" }),
    [type, status]
  )
  const activities = data?.data || []

  return (
    <div>
      <PageHeader title="Activities" subtitle="Everything assigned to you, sorted by due date." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue>{(v) => (v === "ALL" ? "All types" : typeLabel(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue>{(v) => (v === "ALL" ? "All statuses" : typeLabel(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{typeLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <Card className="p-0">
          <CardContent className="divide-y divide-border px-0 py-0">
            {loading ? (
              <div className="space-y-4 px-6 py-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No activities found" description="Try adjusting your filters." />
            ) : (
              activities.map((activity) => (
                <ListRow
                  key={activity.id}
                  icon={ACTIVITY_ICONS[activity.type] || ClipboardList}
                  title={activity.title}
                  subtitle={`${typeLabel(activity.type)}${activity.mandatory ? " · Mandatory" : ""}`}
                  onClick={() => navigate(activityHref(activity))}
                  right={
                    <div className="flex flex-col items-end gap-1">
                      <StatusDot status={activity.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDueLabel(activity.dueDate) || "No due date"}
                      </span>
                    </div>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
