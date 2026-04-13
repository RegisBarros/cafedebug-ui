import type { UserCredentialsRequest, RefreshTokenRequest } from "../../generated/models";
import {
  postApiV1AdminAuthToken,
  postApiV1AdminAuthRefreshToken,
  type postApiV1AdminAuthTokenResponse,
  type postApiV1AdminAuthRefreshTokenResponse
} from "../../generated/admin-auth/admin-auth";

export const createAuthResource = () => ({
  token: (
    body: UserCredentialsRequest,
    options?: RequestInit
  ): Promise<postApiV1AdminAuthTokenResponse> =>
    postApiV1AdminAuthToken(body, options),

  refreshToken: (
    body: RefreshTokenRequest,
    options?: RequestInit
  ): Promise<postApiV1AdminAuthRefreshTokenResponse> =>
    postApiV1AdminAuthRefreshToken(body, options)
});
