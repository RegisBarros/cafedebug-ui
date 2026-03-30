"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  addSentryBreadcrumb,
  captureException,
  logger,
  observabilityEvents
} from "@/lib/observability";
import { postLoginRedirectRoute } from "@/lib/routes";

type LoginFormProps = {
  initialStatusMessage?: string;
};

type LoginErrorResponse = {
  error?: {
    detail?: string;
    status?: number;
    title?: string;
    traceId?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

type LoginFieldState = {
  email?: string;
  password?: string;
};

const readFieldError = (
  fieldErrors: Record<string, string[]> | undefined,
  fieldName: "email" | "password"
): string | undefined => {
  const message = fieldErrors?.[fieldName]?.[0];
  return typeof message === "string" && message.length > 0 ? message : undefined;
};

const parseJson = async (
  response: Response
): Promise<LoginErrorResponse | undefined> => {
  try {
    return (await response.json()) as LoginErrorResponse;
  } catch {
    return undefined;
  }
};

export function LoginForm({ initialStatusMessage }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<LoginFieldState>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailRequiredError =
      email.trim().length > 0 ? undefined : "Email is required.";
    const passwordRequiredError =
      password.length > 0 ? undefined : "Password is required.";
    const nextFieldErrors: LoginFieldState = {
      ...(emailRequiredError ? { email: emailRequiredError } : {}),
      ...(passwordRequiredError ? { password: passwordRequiredError } : {})
    };

    if (nextFieldErrors.email || nextFieldErrors.password) {
      logger.warn(observabilityEvents.authLoginValidationFailed, {
        module: "auth",
        action: "login-form-submit",
        status: 400,
        hasEmailError: Boolean(nextFieldErrors.email),
        hasPasswordError: Boolean(nextFieldErrors.password)
      });

      setFieldErrors(nextFieldErrors);
      setFormError("Please review the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        const emailFieldError = readFieldError(payload?.error?.fieldErrors, "email");
        const passwordFieldError = readFieldError(
          payload?.error?.fieldErrors,
          "password"
        );
        const traceId = payload?.error?.traceId;
        const status = payload?.error?.status ?? response.status;

        setFieldErrors({
          ...(emailFieldError ? { email: emailFieldError } : {}),
          ...(passwordFieldError ? { password: passwordFieldError } : {})
        });

        logger.warn(observabilityEvents.authLoginFailed, {
          module: "auth",
          action: "login-form-submit",
          status,
          ...(traceId ? { traceId } : {})
        });

        addSentryBreadcrumb("Admin login form failed", {
          category: "auth",
          level: "warning",
          data: {
            module: "auth",
            action: "login-form-submit",
            status,
            ...(traceId ? { traceId } : {})
          }
        });

        setFormError(
          payload?.error?.detail ??
            "Unable to sign in. Check your credentials and try again."
        );
        return;
      }

      logger.info(observabilityEvents.authLoginSuccess, {
        module: "auth",
        action: "login-form-submit",
        status: 200
      });

      router.replace(postLoginRedirectRoute);
      router.refresh();
    } catch (error) {
      logger.error(observabilityEvents.authLoginServiceUnavailable, {
        module: "auth",
        action: "login-form-submit",
        status: 503
      });

      captureException(error, {
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

      setFormError(
        "Unable to reach the authentication service. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-[440px] space-y-6 rounded-xl bg-surface-container-low p-6 shadow-ambient">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-on-surface">Admin Sign In</h1>
        <p className="text-sm text-on-surface-variant">
          Use your admin account to manage episodes, settings, and workflows.
        </p>
      </header>

      {initialStatusMessage ? (
        <p
          className="rounded-lg bg-surface-container px-3 py-2 text-sm text-on-surface-variant"
          role="status"
        >
          {initialStatusMessage}
        </p>
      ) : null}

      {formError ? (
        <div
          className="rounded-lg border border-error bg-error-container px-3 py-2 text-sm text-on-error-container"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <label className="block space-y-2 text-sm font-medium text-on-surface">
          Email
          <input
            autoComplete="email"
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            disabled={isSubmitting}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@cafedebug.com"
            type="email"
            value={email}
          />
          {fieldErrors.email ? (
            <p className="text-xs text-error">{fieldErrors.email}</p>
          ) : null}
        </label>

        <label className="block space-y-2 text-sm font-medium text-on-surface">
          Password
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            disabled={isSubmitting}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            type="password"
            value={password}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-error">{fieldErrors.password}</p>
          ) : null}
        </label>

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        {isSubmitting ? (
          <p className="text-center text-xs text-on-surface-variant" role="status">
            Validating session...
          </p>
        ) : null}
      </form>
    </section>
  );
}
