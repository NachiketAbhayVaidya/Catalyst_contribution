import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Users } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminStudents } from "@/api/admin"
import { formatNumber, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminStudentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(searchParams.get("status") || "ALL")

  const { data, loading, error, refetch } = useFetch(
    () => getAdminStudents({ search: search || undefined, status: status === "ALL" ? undefined : status, limit: 50 }),
    [search, status]
  )
  const students = data?.data || []

  return (
    <div>
      <PageHeader title="Students" subtitle="Search, filter, and drill into any student's progress." />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue>{(v) => (v === "ALL" ? "All statuses" : typeLabel(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <Card className="p-0">
          {loading ? (
            <div className="space-y-3 px-6 py-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <EmptyState icon={Users} title="No students found" description="Try adjusting your search or filters." />
          ) : (
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="px-6">Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead className="px-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer border-border"
                      onClick={() => navigate(`/admin/students/${s.id}`)}
                    >
                      <TableCell className="px-6">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.team}</TableCell>
                      <TableCell className="tabular-nums">{formatNumber(s.xp)}</TableCell>
                      <TableCell className="tabular-nums">{s.level}</TableCell>
                      <TableCell className="tabular-nums">{s.completionPercentage}%</TableCell>
                      <TableCell className="tabular-nums">{s.currentStreak}d</TableCell>
                      <TableCell className="px-6">
                        <StatusDot status={s.status} label={typeLabel(s.status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
