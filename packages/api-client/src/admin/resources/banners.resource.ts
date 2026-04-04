import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createBannersResource = (pathClient: PathBasedClient) => ({
  list: {
    get: pathClient[adminApiPaths.banners.list].GET,
    create: pathClient[adminApiPaths.banners.list].POST
  },
  byId: {
    get: pathClient[adminApiPaths.banners.byId].GET,
    update: pathClient[adminApiPaths.banners.byId].PUT,
    remove: pathClient[adminApiPaths.banners.byId].DELETE
  }
});
