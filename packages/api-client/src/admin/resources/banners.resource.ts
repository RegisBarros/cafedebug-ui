import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createBannersResource = (pathClient: PathBasedClient) => ({
  list: {
    get: m(pathClient, adminApiPaths.banners.list, "GET"),
    create: m(pathClient, adminApiPaths.banners.list, "POST")
  },
  byId: {
    get: m(pathClient, adminApiPaths.banners.byId, "GET"),
    update: m(pathClient, adminApiPaths.banners.byId, "PUT"),
    remove: m(pathClient, adminApiPaths.banners.byId, "DELETE")
  }
});
