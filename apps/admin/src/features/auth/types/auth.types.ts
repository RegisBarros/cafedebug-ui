export type LoginRequest = {
  email: string;
  password: string;
};

// Token payload types — match the POST /api/v1/admin/auth/token JSON response body.
// The generated OpenAPI schema (Result) does not capture these fields;
// Strategy B requires manual extraction from the response body.
export type RefreshTokenPayload = {
  token: string;
  expirationDate: string; // ISO 8601 UTC — used as cookie `expires`
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: RefreshTokenPayload;
  tokenType: "Bearer";
  expiresIn: number; // seconds — used as cookie `maxAge`
};

export type LoginFieldName = "email" | "password";

export type LoginFieldState = Partial<Record<LoginFieldName, string>>;

// New: canonical wire-format error envelope
export type AuthErrorEnvelope = {
  status: number;
  title: string;
  detail: string;
  type?: string;
  traceId?: string;
  fieldErrors?: Record<string, string[]>;
};

// New: input type for createErrorResponse
export type AuthErrorPayload = AuthErrorEnvelope & {
  event: string;
  logLevel?: "warn" | "error";
  setCookieHeaders?: string[];
  clearAuthCookies?: boolean;
};

// Keep this — backward compat alias used by loginService
// DO NOT REMOVE — referenced by LoginServiceFailureResult and loginErrorResponseSchema
export type LoginErrorPayload = AuthErrorEnvelope;

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

