import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Sprout } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton"

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    role: z.enum(["STUDENT", "ADMIN"]),
    adminCode: z.string().optional(),
  })
  .refine((data) => data.role !== "ADMIN" || !!data.adminCode?.trim(), {
    message: "An admin invite code is required to create an admin account",
    path: ["adminCode"],
  })

export default function RegisterPage() {
  const { register: registerUser, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "STUDENT", adminCode: "" },
  })
  const role = watch("role")

  async function onSubmit(values) {
    setServerError("")
    try {
      const user = await registerUser(values.name, values.email, values.password, {
        role: values.role,
        adminCode: values.role === "ADMIN" ? values.adminCode : undefined,
      })
      toast.success("Account created")
      navigate(user.role === "ADMIN" ? "/admin" : "/", { replace: true })
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.")
    }
  }

  async function handleGoogleCredential(credential) {
    setServerError("")
    try {
      const user = await loginWithGoogle(credential)
      toast.success("Account created")
      navigate(user.role === "ADMIN" ? "/admin" : "/", { replace: true })
    } catch (err) {
      setServerError(err.message || "Google sign-up failed. Please try again.")
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
            <p className="mt-1 text-sm text-muted-foreground">Create your account</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={role} onValueChange={(v) => setValue("role", v)} className="mb-4">
              <TabsList className="w-full">
                <TabsTrigger value="STUDENT" className="flex-1">Student</TabsTrigger>
                <TabsTrigger value="ADMIN" className="flex-1">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              {serverError && (
                <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[13px] text-foreground">
                  {serverError}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Rahul Sharma" autoComplete="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              {role === "ADMIN" && (
                <div className="space-y-1.5">
                  <Label htmlFor="adminCode">Admin invite code</Label>
                  <Input id="adminCode" placeholder="Provided by your programme lead" {...register("adminCode")} />
                  {errors.adminCode && <p className="text-xs text-destructive">{errors.adminCode.message}</p>}
                </div>
              )}
              <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : role === "ADMIN" ? "Create admin account" : "Create account"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton text="signup_with" onCredential={handleGoogleCredential} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
