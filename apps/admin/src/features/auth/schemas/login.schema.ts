import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required."),
  password: z.string().min(1, "Password is required.")
});

export const loginErrorResponseSchema = z.object({
  error: z
    .object({
      detail: z.string().optional(),
      status: z.number().int().optional(),
      title: z.string().optional(),
      traceId: z.string().optional(),
      fieldErrors: z.record(z.string(), z.array(z.string())).optional()
    })
    .optional()
});

export const loginSuccessResponseSchema = z.object({
  ok: z.boolean().optional(),
  redirectTo: z.string().optional()
});

export type LoginSchemaValues = z.output<typeof loginSchema>;
