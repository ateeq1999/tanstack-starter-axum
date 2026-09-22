import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthCard } from "@/components/layout/auth-card"
import {
  FormError,
  PasswordField,
  SubmitButton,
  TextField,
} from "@/components/common/form-fields"
import { FieldGroup } from "@/components/ui/field"
import { authApi } from "@/features/auth/api"
import { loginSchema, safeRedirect } from "@/features/auth/schemas"
import {
  completeSignIn,
  redirectIfSignedIn,
} from "@/features/auth/session-actions"
import { useApiForm } from "@/lib/use-api-form"
import { SocialButtons } from "@/features/oauth/components/social-buttons"
import { PasskeyLoginButton } from "@/features/passkeys/components/passkey-login-button"
import { QrLoginDialog } from "@/features/qr-login/components/qr-login-panel"

export const Route = createFileRoute("/_public/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(undefined),
    reason: z.string().optional().catch(undefined),
  }),
  beforeLoad: redirectIfSignedIn,
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const router = useRouter()
  const qc = useQueryClient()
  const [notice, setNotice] = useState(search.reason === "session-expired")

  const { form, formError } = useApiForm({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
    request: (value) => authApi.login(value),
    onSuccess: async (token) => {
      await completeSignIn(qc, router, token.access_token, search.redirect)
    },
  })

  const hint = formError?.includes("verified")
    ? "Check your inbox for the verification link, then sign in."
    : formError?.includes("disabled")
      ? "Contact support if you think this is a mistake."
      : undefined

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      footer={
        <>
          No account?{" "}
          <Link to="/register" className="underline">
            Create one
          </Link>
        </>
      }
    >
      {notice && (
        <Alert>
          <AlertDescription>
            Your session expired. Please sign in again.{" "}
            <button className="underline" onClick={() => setNotice(false)}>
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.Field name="email">
            {(field) => (
              <TextField
                field={field}
                label="Email"
                type="email"
                autoComplete="email"
              />
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => <PasswordField field={field} label="Password" />}
          </form.Field>
        </FieldGroup>
        <div aria-live="polite" className="flex flex-col gap-2">
          <FormError message={formError} />
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <SubmitButton form={form} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
        <Link
          to="/forgot-password"
          className="text-center text-xs text-muted-foreground underline"
        >
          Forgot password?
        </Link>
      </form>
      <SocialButtons redirect={safeRedirect(search.redirect)} mode="signin" />
      <div className="flex flex-col gap-2">
        <PasskeyLoginButton redirect={safeRedirect(search.redirect)} />
        <QrLoginDialog redirect={safeRedirect(search.redirect)} />
      </div>
    </AuthCard>
  )
}
