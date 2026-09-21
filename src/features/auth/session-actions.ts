import { useNavigate, useRouter, redirect } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { session } from "@/lib/session"
import { meQueryOptions } from "@/features/users/queries"
import { ApiError } from "@/lib/http"
import type { RouterContext } from "@/router"

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

/** For login/register/forgot: signed-in users belong somewhere else. */
export function redirectIfSignedIn() {
  if (session.hasValidToken()) throw redirect({ to: "/" })
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
