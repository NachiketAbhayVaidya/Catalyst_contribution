import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Award, Trophy, Target, CheckCircle2 } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminStudent } from "@/api/admin"
import { formatDate, formatNumber, typeLabel } from "@/lib/format"

import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export default function AdminStudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => getAdminStudent(studentId), [studentId])
  const detail = data?.data

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    )
  }

  if (!detail) {
    return <ErrorState message="This student could not be found." onRetry={() => navigate("/admin/students")} />
  }

  const { profile } = detail

  return (
    <div>
      <Link to="/admin/students" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to students
      </Link>

      <Card className="mb-6">
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg" className="size-14">
            <AvatarFallback>{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold text-foreground">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">Team: {profile.team}</p>
          </div>
          <StatusDot status={profile.status} label={typeLabel(profile.status)} />
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total XP" value={formatNumber(profile.xp)} icon={Trophy} primary />
        <StatCard label="Level" value={profile.level} icon={Target} />
        <StatCard label="Completion" value={`${profile.completionPercentage}%`} icon={CheckCircle2} />
        <StatCard label="Current streak" value={`${profile.currentStreak} days`} icon={Award} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 divide-y divide-border px-0">
            {detail.achievements.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-muted-foreground">No achievements yet.</p>
            ) : (
              detail.achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Award className="size-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">Unlocked {formatDate(a.unlockedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 divide-y divide-border px-0">
            {detail.submissions.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              detail.submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{s.activityTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.submittedAt)}</p>
                  </div>
                  <StatusDot status={s.status} label={typeLabel(s.status)} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
