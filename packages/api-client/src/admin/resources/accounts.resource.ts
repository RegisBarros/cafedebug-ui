import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createAccountsResource = (pathClient: PathBasedClient) => ({
  forgotPassword: pathClient[adminApiPaths.accounts.forgotPassword].POST,
  changePassword: pathClient[adminApiPaths.accounts.changePassword].POST,
  resetPassword: pathClient[adminApiPaths.accounts.resetPassword].POST,
  verifyEmail: pathClient[adminApiPaths.accounts.verifyEmail].POST
});
