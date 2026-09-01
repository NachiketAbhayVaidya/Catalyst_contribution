import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Zap, Paperclip, X } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getAssignment, getSubmissions, submitAssignment, getSubmissionReview } from "@/api/assignments"
import { uploadFile } from "@/api/files"
import { formatDateTime, formatDueLabel } from "@/lib/format"

import { ErrorState } from "@/components/shared/ErrorState"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

async function loadAll(assignmentId) {
  const [assignmentRes, submissionsRes] = await Promise.all([getAssignment(assignmentId), getSubmissions(assignmentId)])
  return { assignment: assignmentRes.data, submissions: submissionsRes.data }
}

function ReviewDialog({ submissionId, open, onOpenChange }) {
  const { data, loading } = useFetch(() => (open ? getSubmissionReview(submissionId) : Promise.resolve(null)), [submissionId, open])
  const review = data?.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submission feedback</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : !review || review.status !== "COMPLETED" ? (
          <p className="text-sm text-muted-foreground">Feedback isn't ready yet.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{review.summary}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Strengths</p>
                <ul className="space-y-1 text-[13px] text-muted-foreground">
                  {review.strengths.map((s, i) => (
                    <li key={i}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Improvements</p>
                <ul className="space-y-1 text-[13px] text-muted-foreground">
                  {review.improvements.map((s, i) => (
                    <li key={i}>· {s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              {review.rubric.map((r) => (
                <div key={r.criterion} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{r.criterion}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.score} / {r.maxScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function AssignmentPage() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => loadAll(assignmentId), [assignmentId])

  const [text, setText] = useState("")
  const [link, setLink] = useState("")
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewSubmissionId, setReviewSubmissionId] = useState(null)

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  const { assignment, submissions } = data || {}
  if (!assignment) {
    return <ErrorState message="This assignment could not be found." onRetry={() => navigate("/activities")} />
  }

  const attemptsLeft = assignment.maxAttempts - assignment.attemptsUsed
  const canSubmit = attemptsLeft > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text && !link && !file) {
      toast.error("Add a response before submitting.")
      return
    }
    setSubmitting(true)
    try {
      let fileIds = []
      if (file) {
        const uploadRes = await uploadFile(file, "ASSIGNMENT_SUBMISSION")
        fileIds = [uploadRes.data.id]
      }
      await submitAssignment(assignmentId, { text: text || undefined, link: link || undefined, fileIds })
      toast.success("Submitted")
      setText("")
      setLink("")
      setFile(null)
      refetch()
    } catch (err) {
      toast.error(err.message || "Couldn't submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Link to="/activities" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to activities
      </Link>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Assignment</Badge>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{assignment.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{assignment.instructions || assignment.description}</p>
            </div>
            <StatusDot status={assignment.status} className="shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" strokeWidth={1.75} />
              {formatDueLabel(assignment.dueDate)}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="size-3.5" strokeWidth={1.75} />
              {assignment.xpReward} XP
            </span>
            <span>{attemptsLeft} of {assignment.maxAttempts} attempts left</span>
          </div>
        </CardContent>
      </Card>

      {canSubmit && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit your response</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {assignment.submissionTypes.includes("TEXT") && (
                <div className="space-y-1.5">
                  <Label htmlFor="response-text">Written response</Label>
                  <Textarea
                    id="response-text"
                    placeholder="Type your response…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-32"
                  />
                </div>
              )}
              {assignment.submissionTypes.includes("LINK") && (
                <div className="space-y-1.5">
                  <Label htmlFor="response-link">Link</Label>
                  <Input
                    id="response-link"
                    type="url"
                    placeholder="https://…"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              )}
              {assignment.submissionTypes.includes("FILE") && (
                <div className="space-y-1.5">
                  <Label htmlFor="response-file">Attachment</Label>
                  {file ? (
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        <Paperclip className="size-3.5 shrink-0" strokeWidth={1.75} />
                        {file.name}
                      </span>
                      <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Input id="response-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="p-0">
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle>Your submissions</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 divide-y divide-border px-0">
          {submissions.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Attempt {s.attempt}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(s.submittedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusDot status={s.status} />
                  {s.score !== null && s.score !== undefined && (
                    <span className="text-sm font-medium tabular-nums text-foreground">{s.score}/100</span>
                  )}
                  {s.feedbackAvailable && (
                    <Button variant="outline" size="sm" onClick={() => setReviewSubmissionId(s.id)}>
                      View feedback
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ReviewDialog
        submissionId={reviewSubmissionId}
        open={!!reviewSubmissionId}
        onOpenChange={(open) => !open && setReviewSubmissionId(null)}
      />
    </div>
  )
}
