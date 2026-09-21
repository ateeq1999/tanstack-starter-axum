import { useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import type { z } from "zod"
import { toServerErrors } from "./forms"

type Options<S extends z.ZodType, R> = {
  schema: S
  defaultValues: z.input<S>
  request: (value: z.output<S>) => Promise<R>
  onSuccess?: (result: R, value: z.output<S>) => void | Promise<void>
  /** Field that receives a 409 conflict message. */
  conflictField?: string
  /** Maps server field names onto form field names. */
  fieldMap?: Record<string, string>
}

/**
 * TanStack Form wired to a Zod schema and an API request. Server 422/409
 * errors land on the matching field; anything else becomes `formError`.
 * The request runs in `onSubmitAsync` so returned field errors show up on the
 * inputs; `onSuccess` only runs when the request succeeded.
 */
export function useApiForm<S extends z.ZodType, R>(o: Options<S, R>) {
  const [formError, setFormError] = useState<string>()
  const result = useRef<{ ok: true; value: R } | undefined>(undefined)

  const form = useForm({
    defaultValues: o.defaultValues,
    validators: {
      onChange: o.schema as never,
      onSubmitAsync: async ({ value }: { value: z.input<S> }) => {
        setFormError(undefined)
        result.current = undefined
        try {
          const parsed = o.schema.parse(value)
          result.current = { ok: true, value: await o.request(parsed) }
          return undefined
        } catch (error) {
          const { fields, form: formMessage } = toServerErrors(error, {
            conflictField: o.conflictField,
            fieldMap: o.fieldMap,
          })
          setFormError(formMessage)
          return Object.keys(fields).length ? { fields } : undefined
        }
      },
    },
    onSubmit: async ({ value }) => {
      if (!result.current) return
      await o.onSuccess?.(result.current.value, o.schema.parse(value))
    },
  })

  return { form, formError, clearFormError: () => setFormError(undefined) }
}
