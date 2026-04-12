import {
  type BackendApiResult,
  withBackendRefreshHeaders,
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
};

export const requestAuthToken = async (
  input: AuthTokenInput
): Promise<BackendApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) return toConfigurationErrorResult();

  const response = await adminClient.auth.token(input);

  return normalizeBackendResult(response);
};

export const requestRefreshToken = async ({
  refreshToken
}: RefreshTokenInput): Promise<BackendApiResult> => {
  const adminClient = getAdminApiClient();

  if (!adminClient) return toConfigurationErrorResult();

  const response = await adminClient.auth.refreshToken(
    { refreshToken },
    { headers: withBackendRefreshHeaders() }
  );

  return normalizeBackendResult(response);
};
