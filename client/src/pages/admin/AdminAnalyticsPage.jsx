import { TrendingUp, CheckCircle2, Zap, Award } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminAnalytics } from "@/api/admin"
import { formatDate } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function RateList({ items, labelKey, valueKey }) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 px-6 py-3">
          <span className="w-40 shrink-0 truncate text-sm text-foreground">{item[labelKey]}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${item[valueKey]}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{item[valueKey]}%</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data, loading, error, refetch } = useFetch(() => getAdminAnalytics(), [])
  const a = data?.data

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Participation, completion, and performance across the program." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCard loading /><StatCard loading /><StatCard loading /><StatCard loading />
          </>
        ) : (
          <>
            <StatCard label="Participation rate" value={`${a.participationRate}%`} icon={TrendingUp} primary />
            <StatCard label="Completion rate" value={`${a.completionRate}%`} icon={CheckCircle2} />
            <StatCard label="Average XP" value={a.averageXP.toLocaleString()} icon={Zap} />
            <StatCard label="Average score" value={a.averageScore} icon={Award} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Course completion</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 px-0">
            {loading ? <Skeleton className="mx-6 h-24" /> : <RateList items={a.coursePerformance} labelKey="title" valueKey="completionRate" />}
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Team performance</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 px-0">
            {loading ? (
              <Skeleton className="mx-6 h-24" />
            ) : (
              <RateList items={a.teamPerformance} labelKey="name" valueKey="completionPercentage" />
            )}
          </CardContent>
        </Card>

        <Card className="p-0 lg:col-span-2">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle>Participation trend</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 divide-y divide-border px-0">
            {loading ? (
              <Skeleton className="mx-6 h-24" />
            ) : (
              a.participationTrend.map((point) => (
                <div key={point.date} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <span className="text-muted-foreground">{formatDate(point.date)}</span>
                  <span className="font-medium tabular-nums text-foreground">{point.value}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
