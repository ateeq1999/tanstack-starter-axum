import { createFileRoute } from "@tanstack/react-router"
import {
  FormError,
  PasswordField,
  SubmitButton,
} from "@/components/common/form-fields"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { authApi } from "@/features/auth/api"
import { changePasswordSchema } from "@/features/auth/schemas"
import { useLogout } from "@/features/auth/session-actions"
import { useApiForm } from "@/lib/use-api-form"

export const Route = createFileRoute("/_app/settings/security")({
  component: SecuritySettings,
})

function SecuritySettings() {
  const logout = useLogout()

  const { form, formError } = useApiForm({
    schema: changePasswordSchema,
    defaultValues: { current_password: "", new_password: "", confirm: "" },
    request: ({ current_password, new_password }) =>
      authApi.changePassword({ current_password, new_password }),
    onSuccess: () => {
      toast.add({ type: "success", title: "Password updated" })
      form.reset()
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            You stay signed in on this device. Other devices stay signed in
            until their session expires (up to 1 hour).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field name="current_password">
                {(field) => (
                  <PasswordField field={field} label="Current password" />
                )}
              </form.Field>
              <form.Field name="new_password">
                {(field) => (
                  <PasswordField
                    field={field}
                    label="New password"
                    autoComplete="new-password"
                    description="8-128 characters."
                  />
                )}
              </form.Field>
              <form.Field name="confirm">
                {(field) => (
                  <PasswordField
                    field={field}
                    label="Confirm new password"
                    autoComplete="new-password"
                  />
                )}
              </form.Field>
            </FieldGroup>
            <div aria-live="polite">
              <FormError message={formError} />
            </div>
            <div>
              <SubmitButton form={form} pendingLabel="Saving…">
                Change password
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>End your session on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
