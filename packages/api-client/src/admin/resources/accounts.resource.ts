import type { ForgotPasswordRequest, ChangePasswordRequest } from "../../generated/models";
import {
  postApiV1AccountsAdminForgotPassword,
  postApiV1AccountsAdminChangePassword,
  postApiV1AccountsAdminResetPassword,
  postApiV1AccountsAdminVerifyEmail
} from "../../generated/accounts/accounts";

export const createAccountsResource = () => ({
  forgotPassword: (body: ForgotPasswordRequest, options?: RequestInit) =>
    postApiV1AccountsAdminForgotPassword(body, options),

  changePassword: (body: ChangePasswordRequest, options?: RequestInit) =>
    postApiV1AccountsAdminChangePassword(body, options),

  resetPassword: (body: ChangePasswordRequest, options?: RequestInit) =>
    postApiV1AccountsAdminResetPassword(body, options),

  verifyEmail: (body: string, options?: RequestInit) =>
    postApiV1AccountsAdminVerifyEmail(body, options)
});
