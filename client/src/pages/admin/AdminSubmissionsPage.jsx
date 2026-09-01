import { useState } from "react"
import { toast } from "sonner"
import { FileCheck } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAdminSubmissions, reviewSubmission } from "@/api/admin"
import { formatDate, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

function ReviewDialog({ submission, onOpenChange, onReviewed }) {
  const [score, setScore] = useState(submission?.aiSuggestedScore ?? "")
  const [feedback, setFeedback] = useState("")
  const [approved, setApproved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (score === "" || Number(score) < 0 || Number(score) > 100) {
      toast.error("Enter a score between 0 and 100.")
      return
    }
    setSaving(true)
    try {
      await reviewSubmission(submission.id, { score: Number(score), feedback, approvedAiReview: approved })
      toast.success("Review saved")
      onReviewed()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Couldn't save the review.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!submission} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review submission</DialogTitle>
        </DialogHeader>
        {submission && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{submission.activityTitle}</p>
              <p className="text-xs text-muted-foreground">{submission.student.name} · {formatDate(submission.submittedAt)}</p>
            </div>
            {submission.aiSuggestedScore !== undefined && (
              <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[13px] text-muted-foreground">
                AI-suggested score: <span className="font-medium text-foreground">{submission.aiSuggestedScore}</span>
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="score">Score (0–100)</Label>
              <Input id="score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea id="feedback" placeholder="Share feedback with the student…" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={approved} onCheckedChange={(v) => setApproved(!!v)} />
              Approve AI-suggested score
            </label>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save review"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminSubmissionsPage() {
  const [status, setStatus] = useState("PENDING")
  const [reviewing, setReviewing] = useState(null)
  const { data, loading, error, refetch } = useFetch(
    () => getAdminSubmissions({ status: status === "ALL" ? undefined : status, limit: 50 }),
    [status]
  )
  const submissions = data?.data || []

  return (
    <div>
      <PageHeader title="Submissions" subtitle="Review pending student submissions and award scores." />

      <div className="mb-6">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue>{(v) => (v === "ALL" ? "All submissions" : typeLabel(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All submissions</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <Card className="p-0">
          <CardContent className="divide-y divide-border px-0 py-0">
            {loading ? (
              <div className="space-y-4 px-6 py-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <EmptyState icon={FileCheck} title="No submissions" description="Nothing to review right now." />
            ) : (
              submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{s.activityTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.student.name} · {formatDate(s.submittedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <StatusDot status={s.status} label={typeLabel(s.status)} />
                    {s.status === "PENDING" ? (
                      <Button size="sm" onClick={() => setReviewing(s)}>Review</Button>
                    ) : (
                      <span className="text-sm font-medium tabular-nums text-foreground">{s.score}/100</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <ReviewDialog
        submission={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        onReviewed={refetch}
      />
    </div>
  )
}
