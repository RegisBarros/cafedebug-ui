import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createEpisodesResource = (pathClient: PathBasedClient) => ({
  list: {
    get: pathClient[adminApiPaths.episodes.list].GET,
    create: pathClient[adminApiPaths.episodes.list].POST
  },
  byId: {
    get: pathClient[adminApiPaths.episodes.byId].GET,
    update: pathClient[adminApiPaths.episodes.byId].PUT,
    remove: pathClient[adminApiPaths.episodes.byId].DELETE
  }
});
