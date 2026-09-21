import { ApiError } from "./http"

export type ServerErrors = {
  /** Field name -> first message. */
  fields: Record<string, string>
  /** Anything not tied to a field. */
  form?: string
}

/**
 * Turns an ApiError into per-field messages plus an optional form-level one.
 * 422 details map onto fields; 409 lands on `conflictField` when given.
 */
export function toServerErrors(
  error: unknown,
  opts: { conflictField?: string; fieldMap?: Record<string, string> } = {}
): ServerErrors {
  if (!(error instanceof ApiError)) {
    return { fields: {}, form: "Something went wrong. Please try again." }
  }
  if (error.status === 422 && error.details) {
    const fields: Record<string, string> = {}
    for (const [name, issues] of Object.entries(error.details)) {
      const target = opts.fieldMap?.[name] ?? name
      if (issues[0]) fields[target] = issues[0].message
    }
    return { fields }
  }
  if (error.status === 409 && opts.conflictField) {
    return { fields: { [opts.conflictField]: error.message } }
  }
  if (error.status === 429) {
    return { fields: {}, form: "Too many attempts. Try again in a minute." }
  }
  return { fields: {}, form: error.message }
}
