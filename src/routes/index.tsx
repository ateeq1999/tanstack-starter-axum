import { createFileRoute, redirect } from "@tanstack/react-router"
import { requireMe } from "@/features/auth/session-actions"

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const me = await requireMe(context)
    throw redirect({ to: me.role === "admin" ? "/admin" : "/profile" })
  },
})
