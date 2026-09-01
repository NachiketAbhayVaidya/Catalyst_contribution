import { useEffect, useRef, useState } from "react"
import { Sparkles, Send, Plus, MessageSquare } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getConversations, getConversation, sendCoachMessage } from "@/api/ai"
import { cn } from "@/lib/utils"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

export default function AICoachPage() {
  const { data: convosData, refetch: refetchConvos } = useFetch(() => getConversations(), [])
  const conversations = convosData?.data || []

  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setLoadingThread(true)
    getConversation(conversationId)
      .then((res) => setMessages(res.data.messages))
      .finally(() => setLoadingThread(false))
  }, [conversationId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setMessages((prev) => [...prev, { id: `local_${Date.now()}`, role: "user", content: text }])
    setSending(true)
    try {
      const res = await sendCoachMessage({ message: text, conversationId })
      setMessages((prev) => [...prev, res.data.message])
      if (!conversationId) {
        setConversationId(res.data.conversationId)
        refetchConvos()
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Coach"
        subtitle="Ask what to focus on, or how you're tracking."
        action={
          <Button variant="outline" size="sm" onClick={() => setConversationId(null)}>
            <Plus className="size-3.5" strokeWidth={1.75} />
            New chat
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="hidden p-0 lg:block">
          <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No past conversations</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setConversationId(c.id)}
                  className={cn(
                    "block w-full truncate px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    conversationId === c.id ? "bg-accent/50 font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="flex h-[560px] flex-col p-0">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {loadingThread ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="ml-auto h-10 w-1/2" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Ask your AI coach anything"
                description='Try "What should I focus on today?" or "How am I doing?"'
                className="py-16"
              />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2.5">
                  <MessageSquare className="size-3.5 animate-pulse text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-4">
            <Input
              placeholder="Ask your coach…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Send">
              <Send className="size-4" strokeWidth={1.75} />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
