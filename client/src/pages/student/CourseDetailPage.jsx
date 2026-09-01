import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Circle, Clock, Zap } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getCourse, enrollInCourse } from "@/api/courses"
import { typeLabel } from "@/lib/format"

import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [enrolling, setEnrolling] = useState(false)
  const { data, loading, error, refetch } = useFetch(() => getCourse(courseId), [courseId])
  const course = data?.data

  async function handleEnroll() {
    setEnrolling(true)
    try {
      await enrollInCourse(courseId)
      toast.success("Enrolled")
      refetch()
    } catch (err) {
      toast.error(err.message || "Couldn't enroll. Please try again.")
    } finally {
      setEnrolling(false)
    }
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!course) {
    return <ErrorState message="This course could not be found." onRetry={() => navigate("/courses")} />
  }

  return (
    <div>
      <Link to="/courses" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to courses
      </Link>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{typeLabel(course.difficulty)}</Badge>
                {course.mandatory && <Badge variant="outline">Mandatory</Badge>}
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{course.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
            </div>
            {course.enrolled ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                enrolled
              </span>
            ) : (
              <Button onClick={handleEnroll} disabled={enrolling} className="shrink-0">
                {enrolling ? "Enrolling…" : "Enroll in course"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" strokeWidth={1.75} />
              {Math.round(course.durationMinutes / 60)} hours
            </span>
            <span className="flex items-center gap-1">
              <Zap className="size-3.5" strokeWidth={1.75} />
              {course.xpReward} XP
            </span>
            <span>{course.modules.length} modules</span>
          </div>

          {course.enrolled && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="tabular-nums">{course.progress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle>Modules</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 divide-y divide-border px-0">
          {course.modules.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-6 py-3.5">
              {m.completed ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" strokeWidth={1.75} />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.order}. {m.title}
                </p>
                {m.description && <p className="truncate text-xs text-muted-foreground">{m.description}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
