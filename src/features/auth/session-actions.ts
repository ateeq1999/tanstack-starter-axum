import { redirect, useNavigate, useRouter } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { session } from "@/lib/session"
import { meQueryOptions } from "@/features/users/queries"
import { ApiError } from "@/lib/http"
import type { User } from "@/features/users/schemas"
import type { RouterContext } from "@/router"

/** Where a signed-in user lands: admins on the dashboard, others on their profile. */
export function homeFor(me: Pick<User, "role">) {
  return me.role === "admin" ? ("/admin" as const) : ("/profile" as const)
}

/** Sign out: forget the token, drop every cached record, go to /login. */
export function useLogout() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  return async () => {
    session.clear()
    qc.clear()
    await navigate({ to: "/login" })
    void router.invalidate()
  }
}

/** For login/register/forgot: signed-in users belong in the app. */
export async function redirectIfSignedIn({
  context,
}: {
  context: RouterContext
}) {
  if (!session.hasValidToken()) return
  try {
    const me = await context.queryClient.ensureQueryData(meQueryOptions)
    throw redirect({ to: homeFor(me) })
  } catch (error) {
    // a rejected token just means the user stays on the public page
    if (error instanceof ApiError) return
    throw error
  }
}

/** Loads `me`, turning a rejected token into a redirect to /login. */
export async function requireMe(
  context: RouterContext,
  location?: { href: string }
) {
  if (!session.hasValidToken()) {
    throw redirect({
      to: "/login",
      search: location ? { redirect: location.href } : {},
    })
  }
  try {
    return await context.queryClient.ensureQueryData(meQueryOptions)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect({
        to: "/login",
        search: {
          ...(location ? { redirect: location.href } : {}),
          reason: "session-expired",
        },
      })
    }
    throw error
  }
}
