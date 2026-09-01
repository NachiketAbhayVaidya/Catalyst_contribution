import { useState } from "react"
import { toast } from "sonner"
import { BookOpen, Plus, Trash2, Users, Layers } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminCourses, createCourse } from "@/api/admin"
import { formatNumber, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

function emptyModule() {
  return { title: "", description: "" }
}

function CreateCourseDialog({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("BEGINNER")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [xpReward, setXpReward] = useState("100")
  const [mandatory, setMandatory] = useState(false)
  const [certificateBased, setCertificateBased] = useState(false)
  const [modules, setModules] = useState([emptyModule()])
  const [saving, setSaving] = useState(false)

  function reset() {
    setTitle("")
    setDescription("")
    setCategory("")
    setDifficulty("BEGINNER")
    setDurationMinutes("60")
    setXpReward("100")
    setMandatory(false)
    setCertificateBased(false)
    setModules([emptyModule()])
  }

  function updateModule(index, field, value) {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function addModule() {
    setModules((prev) => [...prev, emptyModule()])
  }

  function removeModule(index) {
    setModules((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Give the course a title.")
      return
    }
    setSaving(true)
    try {
      await createCourse({
        title,
        description,
        category,
        difficulty,
        durationMinutes: Number(durationMinutes) || 0,
        xpReward: Number(xpReward) || 0,
        mandatory,
        certificateBased,
        modules: modules.filter((m) => m.title.trim()).map((m) => ({ title: m.title, description: m.description })),
      })
      toast.success(`Course "${title}" created`)
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast.error(err.message || "Couldn't create the course.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Title</Label>
            <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leadership Fundamentals" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="course-description">Description</Label>
            <Textarea id="course-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-category">Category</Label>
              <Input id="course-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Leadership" />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => typeLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-duration">Duration (minutes)</Label>
              <Input id="course-duration" type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-xp">XP reward</Label>
              <Input id="course-xp" type="number" min={0} value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={mandatory} onCheckedChange={(v) => setMandatory(!!v)} />
              Mandatory for all students
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={certificateBased} onCheckedChange={(v) => setCertificateBased(!!v)} />
              Certificate-based course
            </label>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Label>Modules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addModule}>
                <Plus className="size-3.5" strokeWidth={1.75} />
                Add module
              </Button>
            </div>
            {modules.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Input
                    placeholder={`Module ${i + 1} title`}
                    value={m.title}
                    onChange={(e) => updateModule(i, "title", e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={m.description}
                    onChange={(e) => updateModule(i, "description", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0"
                  onClick={() => removeModule(i)}
                  disabled={modules.length === 1}
                  aria-label="Remove module"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create course"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCoursesPage() {
  const { data, loading, error, refetch } = useFetch(() => getAdminCourses({ limit: 100 }), [])
  const [createOpen, setCreateOpen] = useState(false)
  const courses = data?.data || []

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="All courses in the programme, with enrollment and module counts."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" strokeWidth={1.75} />
            Create course
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to get started." />
        </Card>
      ) : (
        <Card className="p-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-6">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead className="px-6">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="px-6">
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{typeLabel(c.difficulty)}</TableCell>
                    <TableCell className="tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                        {c.moduleCount}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                        {formatNumber(c.enrolledCount)}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatNumber(c.xpReward)}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {c.mandatory && <Badge variant="outline">Mandatory</Badge>}
                        {c.certificateBased && <Badge variant="outline">Certificate</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateCourseDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  )
}
