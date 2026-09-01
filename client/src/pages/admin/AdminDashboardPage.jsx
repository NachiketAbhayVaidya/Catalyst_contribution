import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Users, TrendingUp, CheckCircle2, Zap, AlertTriangle, UserPlus } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminDashboard, createAdmin } from "@/api/admin"
import { formatNumber } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

function CreateAdminDialog({ open, onOpenChange }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setName("")
    setEmail("")
    setPassword("")
    setTitle("")
  }

  async function handleCreate() {
    if (!name || !email || password.length < 8) {
      toast.error("Enter a name, email, and a password of at least 8 characters.")
      return
    }
    setSaving(true)
    try {
      await createAdmin({ name, email, password, title: title || undefined })
      toast.success(`Admin account created for ${name}`)
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Couldn't create the admin account.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create admin account</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">Full name</Label>
            <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@katalyst.demo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-title">Title (optional)</Label>
            <Input id="admin-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Programme Manager" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create admin"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useFetch(() => getAdminDashboard(), [])
  const [createOpen, setCreateOpen] = useState(false)
  const d = data?.data

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Program-wide engagement, completion, and health."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-3.5" strokeWidth={1.75} />
            Create admin
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCard loading /><StatCard loading /><StatCard loading /><StatCard loading />
          </>
        ) : (
          <>
            <StatCard label="Total students" value={formatNumber(d.students.total)} icon={Users} primary />
            <StatCard label="Active students" value={formatNumber(d.students.active)} icon={CheckCircle2} />
            <StatCard label="Weekly participation" value={`${d.engagement.weeklyParticipation}%`} icon={TrendingUp} />
            <StatCard label="Average XP" value={formatNumber(d.xp.average)} icon={Zap} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Overall", d.completion.overall],
                  ["Assignments", d.completion.assignments],
                  ["Courses", d.completion.courses],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-heading text-xl font-bold tabular-nums text-foreground">{value}%</p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertTriangle className="size-3.5" strokeWidth={1.75} />
                    Inactive students
                  </span>
                  <Link to="/admin/students?status=INACTIVE" className="font-medium tabular-nums text-foreground hover:text-primary">
                    {d.attentionRequired.inactiveStudents}
                  </Link>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertTriangle className="size-3.5" strokeWidth={1.75} />
                    Overdue assignments
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{d.attentionRequired.overdueAssignments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertTriangle className="size-3.5" strokeWidth={1.75} />
                    Missed mandatory activities
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{d.attentionRequired.missedMandatoryActivities}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 p-0">
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle>Team performance</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 divide-y divide-border px-0">
          {loading ? (
            <div className="space-y-3 px-6 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : d.teamPerformance.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            d.teamPerformance.map((team) => (
              <div key={team.id} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm font-medium text-foreground">{team.name}</span>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="tabular-nums">{formatNumber(team.xp)} XP</span>
                  <span className="tabular-nums">{team.completionPercentage}% complete</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
