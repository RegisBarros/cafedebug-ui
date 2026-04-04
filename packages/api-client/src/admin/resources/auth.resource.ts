import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createAuthResource = (pathClient: PathBasedClient) => ({
  token: pathClient[adminApiPaths.auth.token].POST,
  refreshToken: pathClient[adminApiPaths.auth.refreshToken].POST
});
