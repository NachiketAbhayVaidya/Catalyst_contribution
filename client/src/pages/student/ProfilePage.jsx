import { Flame, Trophy, Award, Lock, Target } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getProfile } from "@/api/student"
import { getXp, getAchievements, getMilestones, getStreak } from "@/api/gamification"
import { formatDate, formatNumber } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

async function loadAll() {
  const [profile, xp, achievements, milestones, streak] = await Promise.all([
    getProfile(),
    getXp(),
    getAchievements(),
    getMilestones(),
    getStreak(),
  ])
  return {
    profile: profile.data,
    xp: xp.data,
    achievements: achievements.data,
    milestones: milestones.data,
    streak: streak.data,
  }
}

export default function ProfilePage() {
  const { data, loading, error, refetch } = useFetch(loadAll, [])

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your progress, achievements, and milestones in one place." />

      {loading ? (
        <Skeleton className="mb-6 h-32 w-full rounded-lg" />
      ) : (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar size="lg" className="size-16">
              <AvatarFallback className="text-lg">{initials(data.profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-heading text-lg font-semibold text-foreground">{data.profile.name}</p>
              <p className="text-sm text-muted-foreground">{data.profile.email}</p>
              {data.profile.team && (
                <p className="mt-1 text-xs text-muted-foreground">Team: {data.profile.team.name}</p>
              )}
            </div>
            <div className="w-full sm:w-56">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Level {data.xp.level}</span>
                <span className="tabular-nums">
                  {formatNumber(data.xp.totalXP)} / {formatNumber(data.xp.xpForNextLevel)} XP
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (data.xp.totalXP / data.xp.xpForNextLevel) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <StatCard label="Total XP" value={formatNumber(data.profile.xp)} icon={Trophy} primary />
            <StatCard label="Rank" value={`#${data.profile.rank}`} icon={Target} />
            <StatCard label="Current streak" value={`${data.profile.currentStreak} days`} icon={Flame} />
            <StatCard label="Completion" value={`${data.profile.completionPercentage}%`} icon={Award} />
          </>
        )}
      </div>

      {!loading && (
        <Tabs defaultValue="achievements">
          <TabsList>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="xp">XP history</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-4">
            <Card className="p-0">
              <CardHeader className="px-6 pt-5 pb-0">
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent className="mt-4 px-0">
                {data.achievements.unlocked.length === 0 && data.achievements.locked.length === 0 ? (
                  <EmptyState icon={Award} title="No achievements yet" description="Complete your first activity to unlock one!" />
                ) : (
                  <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                    {data.achievements.unlocked.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-card px-6 py-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
                          <Award className="size-4 text-primary" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                          <p className="truncate text-xs text-muted-foreground">Unlocked {formatDate(a.unlockedAt)}</p>
                        </div>
                      </div>
                    ))}
                    {data.achievements.locked.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 bg-card px-6 py-4 opacity-60">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Lock className="size-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {a.progress} / {a.requirement}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-4">
            <Card className="p-0">
              <CardHeader className="px-6 pt-5 pb-0">
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent className="mt-4 divide-y divide-border px-0">
                {data.milestones.length === 0 ? (
                  <EmptyState icon={Target} title="No milestones yet" description="Milestones will appear here as they unlock." />
                ) : (
                  data.milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      {m.status === "COMPLETED" ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-foreground">
                          <span className="size-1.5 rounded-full bg-primary" />
                          completed
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatNumber(m.progress)} / {formatNumber(m.target)}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xp" className="mt-4">
            <Card className="p-0">
              <CardHeader className="px-6 pt-5 pb-0">
                <CardTitle>XP history</CardTitle>
              </CardHeader>
              <CardContent className="mt-4 divide-y divide-border px-0">
                {data.xp.transactions.length === 0 ? (
                  <EmptyState icon={Trophy} title="No XP earned yet" description="Complete activities to start earning XP." />
                ) : (
                  data.xp.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{t.reason}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-primary">+{t.amount} XP</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
