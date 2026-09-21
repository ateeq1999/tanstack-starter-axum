import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, "Must be 8-128 characters")
  .max(128, "Must be 8-128 characters")

const emailSchema = z.email("Enter a valid email")

// Login deliberately skips the length rule: a wrong-length password should get
// "invalid email or password", not a hint about the rule.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Required"),
})

export const registerSchema = z
  .object({ email: emailSchema, password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })

export const forgotSchema = z.object({ email: emailSchema })

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Required"),
    new_password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })

export const changeEmailSchema = z.object({
  new_email: emailSchema,
  current_password: z.string().min(1, "Required"),
})

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})

/** Only same-origin absolute paths are accepted as post-login targets. */
export function safeRedirect(target: string | undefined): string | undefined {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return
  if (target.includes("\\")) return
  return target
}
