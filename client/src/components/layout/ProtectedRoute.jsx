import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children, role }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/"} replace />
  }

  return children
}
