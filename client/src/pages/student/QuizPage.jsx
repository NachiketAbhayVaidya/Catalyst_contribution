import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Clock, HelpCircle, Trophy, Zap } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getQuiz, startQuiz, submitQuiz } from "@/api/quizzes"

import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

function formatSeconds(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function QuizPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useFetch(() => getQuiz(quizId), [quizId])
  const quiz = data?.data

  const [phase, setPhase] = useState("intro")
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  async function handleStart() {
    try {
      const res = await startQuiz(quizId)
      setAttempt(res.data)
      setAnswers({})
      setSecondsLeft(quiz.timeLimitSeconds)
      setPhase("active")
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      toast.error(err.message || "Couldn't start the quiz.")
    }
  }

  async function handleSubmit() {
    clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const payload = {
        attemptId: attempt.attemptId,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
      }
      const res = await submitQuiz(quizId, payload)
      setResult(res.data)
      setPhase("results")
    } catch (err) {
      toast.error(err.message || "Couldn't submit the quiz.")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (phase === "active" && secondsLeft === 0 && attempt) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase])

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  if (!quiz) {
    return <ErrorState message="This quiz could not be found." onRetry={() => navigate("/activities")} />
  }

  if (phase === "results" && result) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent">
          <Trophy className="size-6 text-primary" strokeWidth={1.75} />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Quiz complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You scored {result.correctAnswers} out of {result.totalQuestions}
        </p>
        <Card className="mt-6">
          <CardContent className="flex items-center justify-around py-2">
            <div>
              <p className="font-heading text-2xl font-bold tabular-nums text-foreground">{result.score}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-heading text-2xl font-bold tabular-nums text-primary">+{result.xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
          </CardContent>
        </Card>
        <Button className="mt-6" onClick={() => navigate("/activities")}>
          Back to activities
        </Button>
      </div>
    )
  }

  if (phase === "active" && attempt) {
    const answeredCount = Object.keys(answers).length
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">{quiz.title}</h1>
          <span className="flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
            <Clock className="size-4" strokeWidth={1.75} />
            {formatSeconds(secondsLeft)}
          </span>
        </div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(answeredCount / attempt.questions.length) * 100}%` }}
          />
        </div>

        <div className="space-y-4">
          {attempt.questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                >
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.id} id={opt.id} />
                      <Label htmlFor={opt.id} className="font-normal">{opt.text}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="mt-6 w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : `Submit (${answeredCount}/${attempt.questions.length} answered)`}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Link to="/activities" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to activities
      </Link>
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent">
            <HelpCircle className="size-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" strokeWidth={1.75} />
              {Math.round(quiz.timeLimitSeconds / 60)} min
            </span>
            <span>{quiz.totalQuestions} questions</span>
            <span className="flex items-center gap-1">
              <Zap className="size-3.5" strokeWidth={1.75} />
              {quiz.xpReward} XP
            </span>
            <span>{quiz.attemptsAllowed} attempts allowed</span>
          </div>
          <Button className="mt-2 w-full" onClick={handleStart}>
            Start quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
