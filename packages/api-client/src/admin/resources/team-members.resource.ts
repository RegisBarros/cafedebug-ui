import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createTeamMembersResource = (pathClient: PathBasedClient) => ({
  list: {
    get: m(pathClient, adminApiPaths.teamMembers.list, "GET"),
    create: m(pathClient, adminApiPaths.teamMembers.list, "POST")
  },
  byId: {
    get: m(pathClient, adminApiPaths.teamMembers.byId, "GET"),
    update: m(pathClient, adminApiPaths.teamMembers.byId, "PUT"),
    remove: m(pathClient, adminApiPaths.teamMembers.byId, "DELETE")
  }
});
