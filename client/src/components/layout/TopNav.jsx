import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { getNotifications } from "@/api/notifications"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Trophy,
  Users,
  FileCheck,
  BarChart3,
  FileBarChart,
  Bell,
  Sparkles,
  Menu,
  LogOut,
  UserCircle,
} from "lucide-react"

const studentNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/activities", label: "Activities", icon: ListChecks },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/team", label: "Team", icon: Users },
]

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/submissions", label: "Submissions", icon: FileCheck },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
]

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function NavPill({ to, label, icon: Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
      {label}
    </NavLink>
  )
}

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === "ADMIN"
  const nav = isAdmin ? adminNav : studentNav

  useEffect(() => {
    if (isAdmin) return
    let cancelled = false
    getNotifications({ limit: 1 })
      .then((res) => {
        if (!cancelled) setUnreadCount(res.unreadCount || 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-card">
      <div className="mx-auto flex h-full max-w-[1120px] items-center gap-2 px-4 sm:px-6">
        <NavLink to={isAdmin ? "/admin" : "/"} className="mr-2 shrink-0 font-heading text-[15px] font-bold text-foreground">
          Katalyst
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <NavPill key={item.to} {...item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {!isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden sm:inline-flex"
                nativeButton={false}
                render={<NavLink to="/notifications" aria-label="Notifications" />}
              >
                <Bell className="size-4" strokeWidth={1.75} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />}
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" nativeButton={false} render={<NavLink to="/ai-coach" />}>
                <Sparkles className="size-3.5" strokeWidth={1.75} />
                AI Coach
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button type="button" className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
              }
            >
              <Avatar>
                <AvatarFallback>{initials(user?.name)}</AvatarFallback>
                {!isAdmin && unreadCount > 0 && <AvatarBadge className="sm:hidden" />}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-1.5 py-1.5">
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isAdmin && (
                <DropdownMenuItem render={<NavLink to="/profile" />}>
                  <UserCircle className="size-4" strokeWidth={1.75} />
                  Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="size-4" strokeWidth={1.75} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
            >
              <Menu className="size-4" strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {nav.map((item) => (
                  <NavPill key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                ))}
                {!isAdmin && (
                  <>
                    <NavPill to="/notifications" label="Notifications" icon={Bell} onClick={() => setMobileOpen(false)} />
                    <NavPill to="/ai-coach" label="AI Coach" icon={Sparkles} onClick={() => setMobileOpen(false)} />
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
