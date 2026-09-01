import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { GoogleLogo } from "@/components/shared/GoogleLogo"
import { GOOGLE_CLIENT_ID, waitForGoogleIdentity } from "@/lib/google-auth"

// Renders Google's own "Continue with Google" / "Sign up with Google" button
// via Identity Services. If VITE_GOOGLE_CLIENT_ID isn't set (no Google Cloud
// OAuth credentials configured yet), falls back to a disabled placeholder
// instead of a broken/silent button.
export function GoogleSignInButton({ text = "continue_with", onCredential }) {
  const containerRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false

    waitForGoogleIdentity()
      .then((google) => {
        if (cancelled || !containerRef.current) return
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        })
        google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          width: 336,
          text,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setFailed(true)
          toast.error(err.message)
        }
      })

    return () => {
      cancelled = true
    }
  }, [text, onCredential])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled
        title="Google Sign-In isn't configured yet — set VITE_GOOGLE_CLIENT_ID in client/.env.local"
      >
        <GoogleLogo />
        Continue with Google
      </Button>
    )
  }

  if (failed) {
    return (
      <Button type="button" variant="outline" className="w-full gap-2" disabled>
        <GoogleLogo />
        Google Sign-In unavailable
      </Button>
    )
  }

  return <div ref={containerRef} className="flex w-full justify-center [&>div]:w-full" />
}
