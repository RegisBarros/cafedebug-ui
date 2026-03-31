import type { ApiFieldErrors } from "@cafedebug/api-client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginFieldName = "email" | "password";

export type LoginFieldState = Partial<Record<LoginFieldName, string>>;

export type LoginErrorPayload = {
  detail: string;
  status: number;
  title: string;
  traceId?: string;
  fieldErrors?: ApiFieldErrors;
};

export type LoginServiceSuccessResult = {
  ok: true;
  redirectTo: string;
};

export type LoginServiceFailureResult = {
  ok: false;
  error: LoginErrorPayload & {
    kind: "response" | "transport";
    cause?: unknown;
  };
};

export type LoginServiceResult =
  | LoginServiceSuccessResult
  | LoginServiceFailureResult;

export type LoginErrorResponsePayload = {
  error?: {
    detail?: string;
    status?: number;
    title?: string;
    traceId?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type LoginSuccessResponsePayload = {
  ok?: boolean;
  redirectTo?: string;
};
