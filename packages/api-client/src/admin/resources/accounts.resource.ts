import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createAccountsResource = (pathClient: PathBasedClient) => ({
  forgotPassword: m(pathClient, adminApiPaths.accounts.forgotPassword, "POST"),
  changePassword: m(pathClient, adminApiPaths.accounts.changePassword, "POST"),
  resetPassword: m(pathClient, adminApiPaths.accounts.resetPassword, "POST"),
  verifyEmail: m(pathClient, adminApiPaths.accounts.verifyEmail, "POST")
});
