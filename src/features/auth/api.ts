import { http } from "@/lib/http"
import { userSchema } from "@/features/users/schemas"
import type { Role } from "@/features/users/schemas"
import { tokenResponseSchema } from "./schemas"

// Request bodies follow the field names in the frontend plan; keep every
// wire-level name in this file so a DTO mismatch is a one-place fix.
export const authApi = {
  register: async (body: { email: string; password: string }) =>
    userSchema.parse(
      await http("/api/v1/auth/register", {
        method: "POST",
        body,
        skipExpire: true,
      })
    ),

  login: async (body: { email: string; password: string }) =>
    tokenResponseSchema.parse(
      await http("/api/v1/auth/login", {
        method: "POST",
        body,
        skipExpire: true,
      })
    ),

  forgotPassword: (body: { email: string }) =>
    http<void>("/api/v1/auth/password/forgot", {
      method: "POST",
      body,
      skipExpire: true,
    }),

  resetPassword: (body: { token: string; new_password: string }) =>
    http<void>("/api/v1/auth/password/reset", {
      method: "POST",
      body,
      skipExpire: true,
    }),

  changePassword: (body: { current_password: string; new_password: string }) =>
    http<void>("/api/v1/auth/password/change", { method: "POST", body }),

  verifyEmail: (body: { token: string }) =>
    http<void>("/api/v1/auth/email/verify", {
      method: "POST",
      body,
      skipExpire: true,
    }),

  resendVerification: () =>
    http<void>("/api/v1/auth/email/verification/resend", { method: "POST" }),

  changeEmail: (body: { new_email: string; current_password: string }) =>
    http<void>("/api/v1/auth/email/change", { method: "POST", body }),

  confirmEmailChange: (body: { token: string }) =>
    http<{ email?: string } | void>("/api/v1/auth/email/change/confirm", {
      method: "POST",
      body,
      skipExpire: true,
    }),

  invite: async (body: { email: string; display_name?: string; role: Role }) =>
    userSchema.parse(
      await http("/api/v1/auth/invitations", { method: "POST", body })
    ),
}
