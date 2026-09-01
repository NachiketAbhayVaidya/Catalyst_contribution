import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Sprout } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton"

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })

  function goToLandingPage(user) {
    const from = location.state?.from?.pathname
    navigate(from || (user.role === "ADMIN" ? "/admin" : "/"), { replace: true })
  }

  async function onSubmit(values) {
    setServerError("")
    try {
      const user = await login(values.email, values.password)
      toast.success("Welcome back")
      goToLandingPage(user)
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.")
    }
  }

  async function handleGoogleCredential(credential) {
    setServerError("")
    try {
      const user = await loginWithGoogle(credential)
      toast.success("Welcome back")
      goToLandingPage(user)
    } catch (err) {
      setServerError(err.message || "Google sign-in failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent">
            <Sprout className="size-5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-foreground">Katalyst</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your learning journey</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              {serverError && (
                <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[13px] text-foreground">
                  {serverError}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
                {isSubmitting ? "Logging in…" : "Log in"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton text="continue_with" onCredential={handleGoogleCredential} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo accounts — student: rahul@example.com · admin: admin@example.com (password: Password123!)
        </p>
      </div>
    </div>
  )
}
