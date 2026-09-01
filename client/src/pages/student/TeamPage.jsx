import { Users2 } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useFetch } from "@/hooks/use-fetch"
import { getTeam } from "@/api/gamification"
import { formatNumber } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Target, CheckCircle2 } from "lucide-react"

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

export default function TeamPage() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useFetch(() => getTeam(), [])
  const team = data?.data

  return (
    <div>
      <PageHeader title="Team" subtitle="Your team's standing and members." />

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent">
                <Users2 className="size-5 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">{team.name}</p>
                <p className="text-sm text-muted-foreground">Ranked #{team.rank} overall</p>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatCard label="Team rank" value={`#${team.rank}`} icon={Trophy} primary />
            <StatCard label="Team XP" value={formatNumber(team.xp)} icon={Target} />
            <StatCard label="Completion" value={`${team.completionPercentage}%`} icon={CheckCircle2} />
          </div>

          <Card className="p-0">
            <CardHeader className="px-6 pt-5 pb-0">
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="mt-4 divide-y divide-border px-0">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-6 py-3.5">
                  <Avatar>
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.name}
                      {member.id === user?.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.contributionPercentage}% of team XP</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatNumber(member.xp)} XP
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
