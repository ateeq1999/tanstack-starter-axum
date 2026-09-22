import { session } from "./session"

export type FieldIssue = {
  code: string
  message: string
  params?: Record<string, unknown>
}
export type FieldDetails = Record<string, FieldIssue[]>

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: FieldDetails

  constructor(
    status: number,
    code: string,
    message: string,
    details?: FieldDetails
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ""

/** For <img src> and full-page navigations (OAuth): the API path with the API origin prefixed. */
export function apiUrl(path: string) {
  return `${BASE_URL}${path}`
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  /** Sent as-is (e.g. an avatar upload). Wins over `body` when both are set. */
  rawBody?: Blob
  /** Extra headers, e.g. { "X-QR-Secret": secret }. */
  headers?: Record<string, string>
  query?: Record<string, string | number | undefined>
  /** Login-style calls: a 401 is a normal answer, not an expired session. */
  skipExpire?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Options["query"]) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`
}

export async function http<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  const token = session.token
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.rawBody) {
    headers["Content-Type"] = opts.rawBody.type || "application/octet-stream"
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json"
  }
  if (opts.headers) Object.assign(headers, opts.headers)

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body:
        opts.rawBody ??
        (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw new ApiError(0, "network_error", "Cannot reach the server")
  }

  if (res.status === 204) return undefined as T

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    const err = (
      payload as {
        error?: { code?: string; message?: string; details?: FieldDetails }
      } | null
    )?.error
    const apiError = new ApiError(
      res.status,
      err?.code ?? "unknown",
      err?.message ?? (res.statusText || "Request failed"),
      err?.details
    )
    if (res.status === 401 && !opts.skipExpire) session.expire()
    throw apiError
  }

  return payload as T
}
