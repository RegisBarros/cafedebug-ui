"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";

import { loginSchema, type LoginSchemaValues } from "../schemas/login.schema";
import { loginService } from "../services/login.service";

const readFieldError = (
  fieldErrors: Record<string, string[]> | undefined,
  fieldName: "email" | "password"
): string | undefined => {
  const message = fieldErrors?.[fieldName]?.[0];
  return typeof message === "string" && message.length > 0 ? message : undefined;
};

export const useLogin = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();

  const form = useForm<LoginSchemaValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      setFormError(undefined);

      const result = await loginService(values);

      if (!result.ok) {
        const emailFieldError = readFieldError(result.error.fieldErrors, "email");
        const passwordFieldError = readFieldError(
          result.error.fieldErrors,
          "password"
        );

        if (emailFieldError) {
          form.setError("email", {
            type: "server",
            message: emailFieldError
          });
        }

        if (passwordFieldError) {
          form.setError("password", {
            type: "server",
            message: passwordFieldError
          });
        }

        if (result.error.kind === "transport") {
          // Transport errors: browser could not reach the Next.js server.
          // These are client-only failures — log here since the server never sees them.
          logger.error(observabilityEvents.authLoginServiceUnavailable, {
            module: "auth",
            action: "login-form-submit",
            status: 503
          });

          captureException(result.error.cause, {
            scope: {
              tags: {
                module: "auth",
                action: "login-form-submit"
              },
              level: "error"
            },
            context: {
              status: 503
            }
          });

          setFormError(result.error.detail);
          return;
        }

        // Response errors (401, 400, 500, 503 from handler) are already logged
        // server-side in loginHandler — no duplicate logging here (P2-T4).
        addSentryBreadcrumb("Admin login form failed", {
          category: "auth",
          level: "warning",
          data: {
            module: "auth",
            action: "login-form-submit",
            status: result.error.status,
            ...(result.error.traceId ? { traceId: result.error.traceId } : {})
          }
        });

        setFormError(result.error.detail);
        return;
      }

      // authLoginSuccess is already logged server-side in loginHandler (P2-T4).
      router.replace(result.redirectTo);
      router.refresh();
    },
    (errors) => {
      logger.warn(observabilityEvents.authLoginValidationFailed, {
        module: "auth",
        action: "login-form-submit",
        status: 400,
        hasEmailError: Boolean(errors.email),
        hasPasswordError: Boolean(errors.password)
      });

      setFormError("Please review the highlighted fields.");
    }
  );

  return {
    form,
    formError,
    onSubmit
  };
};
