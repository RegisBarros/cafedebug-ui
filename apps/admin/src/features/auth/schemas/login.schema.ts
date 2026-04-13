import { z } from "zod";

export const loginSchema = z.object({
  // GAP-04: Added .email() format validation
  email: z.string().trim().min(1, "Email is required.").email("Please enter a valid email address."),
  // GAP-05: Added minimum length of 8 characters
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
});

export const loginErrorResponseSchema = z.object({
  error: z
    .object({
      detail: z.string().optional(),
      status: z.number().int().optional(),
      title: z.string().optional(),
      // GAP-09: Added `type` field to capture the error type URI from the API envelope
      type: z.string().optional(),
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
