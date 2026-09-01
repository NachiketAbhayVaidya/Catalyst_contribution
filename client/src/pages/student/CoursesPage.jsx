import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, Search, Clock, Zap } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getCourses } from "@/api/courses"
import { typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export default function CoursesPage() {
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => getCourses({ limit: 50 }), [])
  const courses = data?.data || []

  const filtered = search
    ? courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : courses

  return (
    <div>
      <PageHeader title="Courses" subtitle="Browse and continue your learning courses." />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} title="No courses found" description="Try a different search term." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline">{course.category}</Badge>
                  {course.enrolled && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      enrolled
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-heading text-[15px] font-semibold text-foreground">{course.title}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{course.description}</p>
                </div>
                <div className="mt-auto flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" strokeWidth={1.75} />
                    {Math.round(course.durationMinutes / 60)}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="size-3.5" strokeWidth={1.75} />
                    {course.xpReward} XP
                  </span>
                  <span>{typeLabel(course.difficulty)}</span>
                </div>
                {course.enrolled && (
                  <div className="space-y-1">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                    </div>
                    <p className="text-right text-xs text-muted-foreground tabular-nums">{course.progress}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
