import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { PageHeader } from "@/components/layout/page-header"
import {
  FormError,
  SubmitButton,
  TextField,
} from "@/components/common/form-fields"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { meQueryOptions, useUpdateMe } from "@/features/users/queries"
import {
  displayNameSchema,
  initials,
  userLabel,
} from "@/features/users/schemas"
import { useApiForm } from "@/lib/use-api-form"
import { z } from "zod"

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
})

const nameFormSchema = z.object({ display_name: displayNameSchema })

function ProfilePage() {
  const { data: me } = useSuspenseQuery(meQueryOptions)
  const update = useUpdateMe()

  const { form, formError } = useApiForm({
    schema: nameFormSchema,
    defaultValues: { display_name: me.display_name ?? "" },
    request: (value) => update.mutateAsync(value),
    onSuccess: () => {
      toast.add({ type: "success", title: "Profile updated" })
    },
  })

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Profile" />
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(me)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate">{userLabel(me)}</CardTitle>
            <CardDescription>
              Member since {format(new Date(me.created_at), "PP")}
            </CardDescription>
          </div>
          <Badge
            className="ml-auto"
            variant={me.role === "admin" ? "default" : "secondary"}
          >
            {me.role}
          </Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>Shown across the app.</CardDescription>
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
              <form.Field name="display_name">
                {(field) => (
                  <TextField
                    field={field}
                    label="Name"
                    autoComplete="name"
                    maxLength={100}
                  />
                )}
              </form.Field>
            </FieldGroup>
            <div aria-live="polite">
              <FormError message={formError} />
            </div>
            <div>
              <SubmitButton form={form} pendingLabel="Saving…">
                Save
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Email">
            <span className="truncate">{me.email}</span>
            <Badge variant={me.email_verified ? "secondary" : "destructive"}>
              {me.email_verified ? "Verified" : "Unverified"}
            </Badge>
          </Row>
          <Row label="Status">
            <Badge variant={me.is_active ? "secondary" : "destructive"}>
              {me.is_active ? "Active" : "Deactivated"}
            </Badge>
          </Row>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </div>
  )
}
