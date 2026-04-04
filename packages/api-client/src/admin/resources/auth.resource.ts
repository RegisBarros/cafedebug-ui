import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createAuthResource = (pathClient: PathBasedClient) => ({
  token: m(pathClient, adminApiPaths.auth.token, "POST"),
  refreshToken: m(pathClient, adminApiPaths.auth.refreshToken, "POST")
});
