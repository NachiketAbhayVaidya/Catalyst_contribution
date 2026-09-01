import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Calendar, MapPin, Video, Zap } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getActivity } from "@/api/student"
import { getSessions, registerForSession } from "@/api/sessions"
import { formatDateTime, formatDueLabel, typeLabel } from "@/lib/format"

import { ErrorState } from "@/components/shared/ErrorState"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

async function loadDetail(activityId) {
  const activityRes = await getActivity(activityId)
  const activity = activityRes.data
  let session = null
  if (activity?.type === "TRAINING_SESSION") {
    const sessionsRes = await getSessions()
    session = sessionsRes.data.find((s) => s.id === activity.linkedId) || null
  }
  return { activity, session }
}

export default function ActivityDetailPage() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const [registering, setRegistering] = useState(false)
  const { data, loading, error, refetch } = useFetch(() => loadDetail(activityId), [activityId])

  async function handleRegister() {
    if (!data?.session) return
    setRegistering(true)
    try {
      await registerForSession(data.session.id)
      toast.success("Registered for session")
      refetch()
    } catch (err) {
      toast.error(err.message || "Couldn't register. Please try again.")
    } finally {
      setRegistering(false)
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  const { activity, session } = data || {}

  if (!activity) {
    return <ErrorState message="This activity could not be found." onRetry={() => navigate("/activities")} />
  }

  return (
    <div>
      <Link to="/activities" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to activities
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{typeLabel(activity.type)}</Badge>
                {activity.mandatory && <Badge variant="outline">Mandatory</Badge>}
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{activity.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activity.description}</p>
            </div>
            <StatusDot status={activity.status} className="shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            {activity.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" strokeWidth={1.75} />
                {formatDueLabel(activity.dueDate)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Zap className="size-3.5" strokeWidth={1.75} />
              {activity.xpReward} XP
            </span>
          </div>

          {activity.instructions && (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-medium text-foreground">Instructions</p>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{activity.instructions}</p>
            </div>
          )}

          {session && (
            <div className="space-y-3 rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Session details</p>
                {session.registered ? (
                  <StatusDot status="ACTIVE" label="registered" />
                ) : (
                  <Button size="sm" onClick={handleRegister} disabled={registering}>
                    {registering ? "Registering…" : "Register"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {formatDateTime(session.startTime)} – {formatDateTime(session.endTime)}
                </span>
                <span className="flex items-center gap-2">
                  {session.meetingUrl ? (
                    <Video className="size-3.5 shrink-0" strokeWidth={1.75} />
                  ) : (
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
                  )}
                  {session.location}
                </span>
                <span>Trainer: {session.trainer.name}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
