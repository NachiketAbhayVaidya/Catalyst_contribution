import { useState } from "react"
import { Trophy, Target } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useFetch } from "@/hooks/use-fetch"
import { getLeaderboard } from "@/api/leaderboard"
import { formatNumber, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SCOPES = ["GLOBAL", "TEAM", "COURSE"]
const PERIODS = ["WEEKLY", "MONTHLY", "YEARLY", "ALL_TIME"]

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [scope, setScope] = useState("GLOBAL")
  const [period, setPeriod] = useState("WEEKLY")

  const { data, loading, error, refetch } = useFetch(() => getLeaderboard({ scope, period, limit: 20 }), [scope, period])
  const board = data?.data

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="See how you stack up against your peers." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-40"><SelectValue>{(v) => typeLabel(v)}</SelectValue></SelectTrigger>
          <SelectContent>
            {SCOPES.map((s) => (
              <SelectItem key={s} value={s}>{typeLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue>{(v) => typeLabel(v)}</SelectValue></SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>{typeLabel(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4">
            {loading ? (
              <>
                <StatCard loading />
                <StatCard loading />
              </>
            ) : (
              <>
                <StatCard label="Your rank" value={`#${board.myRank}`} icon={Trophy} primary />
                <StatCard label="Your XP" value={formatNumber(board.myXP)} icon={Target} />
              </>
            )}
          </div>

          <Card className="p-0">
            <CardContent className="divide-y divide-border px-0 py-0">
              {loading ? (
                <div className="space-y-3 px-6 py-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : board.entries.length === 0 ? (
                <EmptyState icon={Trophy} title="No rankings yet" description="Check back once activity picks up." />
              ) : (
                board.entries.map((entry) => {
                  const isMe = entry.student.id === user?.id
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between px-6 py-3.5 ${isMe ? "bg-accent/50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-sm text-muted-foreground tabular-nums">#{entry.rank}</span>
                        <span className={`text-sm ${isMe ? "font-semibold text-foreground" : "text-foreground"}`}>
                          {entry.student.name}
                          {isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Level {entry.level}</span>
                        <span className="font-medium tabular-nums text-foreground">{formatNumber(entry.xp)} XP</span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
