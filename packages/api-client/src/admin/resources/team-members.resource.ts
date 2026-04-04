import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createTeamMembersResource = (pathClient: PathBasedClient) => ({
  list: {
    get: pathClient[adminApiPaths.teamMembers.list].GET,
    create: pathClient[adminApiPaths.teamMembers.list].POST
  },
  byId: {
    get: pathClient[adminApiPaths.teamMembers.byId].GET,
    update: pathClient[adminApiPaths.teamMembers.byId].PUT,
    remove: pathClient[adminApiPaths.teamMembers.byId].DELETE
  }
});
