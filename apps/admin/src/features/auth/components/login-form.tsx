"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { useLogin } from "../hooks/use-login";
import { resolveLoginStatusMessage } from "../login-status-message";

const readErrorMessage = (message: unknown): ReactNode =>
  typeof message === "string" && message.length > 0 ? message : null;

export function LoginForm() {
  const searchParams = useSearchParams();
  const {
    form,
    formError,
    onSubmit
  } = useLogin();
  const initialStatusMessage = resolveLoginStatusMessage(
    searchParams.get("reason") ?? undefined
  );

  const {
    register,
    formState: { errors, isSubmitting }
  } = form;

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

      <form className="space-y-4" noValidate onSubmit={onSubmit}>
        <label className="block space-y-2 text-sm font-medium text-on-surface">
          Email
          <input
            autoComplete="email"
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            disabled={isSubmitting}
            placeholder="admin@cafedebug.com"
            type="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-error">{readErrorMessage(errors.email.message)}</p>
          ) : null}
        </label>

        <label className="block space-y-2 text-sm font-medium text-on-surface">
          Password
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
            disabled={isSubmitting}
            placeholder="••••••••"
            type="password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-error">
              {readErrorMessage(errors.password.message)}
            </p>
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
