import {
  Bell,
  Award,
  ClipboardCheck,
  CalendarClock,
  Target,
  Users2,
} from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/notifications"
import { formatDateTime } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const TYPE_ICONS = {
  ACHIEVEMENT_UNLOCKED: Award,
  MILESTONE_COMPLETED: Target,
  ASSIGNMENT_DUE: ClipboardCheck,
  SUBMISSION_REVIEWED: ClipboardCheck,
  SESSION_REMINDER: CalendarClock,
  TEAM_UPDATE: Users2,
}

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useFetch(() => getNotifications({ limit: 50 }), [])
  const notifications = data?.data || []
  const unreadCount = data?.unreadCount || 0

  async function handleRead(id) {
    await markNotificationRead(id)
    refetch()
  }

  async function handleReadAll() {
    await markAllNotificationsRead()
    refetch()
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay on top of achievements, due dates, and updates."
        action={
          !loading &&
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleReadAll}>
              Mark all as read
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <Card className="p-0">
          <CardContent className="divide-y divide-border px-0 py-0">
            {loading ? (
              <div className="space-y-4 px-6 py-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something needs your attention." />
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && handleRead(n.id)}
                    className={`flex w-full items-start gap-3 px-6 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                      !n.read ? "bg-accent/30" : ""
                    }`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
