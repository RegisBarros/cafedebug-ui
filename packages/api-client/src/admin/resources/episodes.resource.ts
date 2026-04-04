import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createEpisodesResource = (pathClient: PathBasedClient) => ({
  list: {
    get: m(pathClient, adminApiPaths.episodes.list, "GET"),
    create: m(pathClient, adminApiPaths.episodes.list, "POST")
  },
  byId: {
    get: m(pathClient, adminApiPaths.episodes.byId, "GET"),
    update: m(pathClient, adminApiPaths.episodes.byId, "PUT"),
    remove: m(pathClient, adminApiPaths.episodes.byId, "DELETE")
  }
});
