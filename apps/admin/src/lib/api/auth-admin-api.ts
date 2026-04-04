import {
  type BackendApiResult,
  withAuthCookieHeader,
  toConfigurationErrorResult,
  normalizeBackendResult
} from "./backend-api.utils";
import { getAdminApiClient } from "./admin-client";

export type AuthTokenInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
  cookieHeader?: string;
};

export const requestAuthToken = async (
  input: AuthTokenInput
): Promise<BackendApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) return toConfigurationErrorResult();

  const response = await adminClient.auth.token({ body: input });

  return normalizeBackendResult(response);
};

export const requestRefreshToken = async ({
  refreshToken,
  cookieHeader = ""
}: RefreshTokenInput): Promise<BackendApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) return toConfigurationErrorResult();

  const response = await adminClient.auth.refreshToken({
    body: { refreshToken },
    headers: withAuthCookieHeader(cookieHeader)
  });

  return normalizeBackendResult(response);
};
