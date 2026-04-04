import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createCategoriesResource = (pathClient: PathBasedClient) => ({
  list: {
    get: m(pathClient, adminApiPaths.categories.list, "GET"),
    create: m(pathClient, adminApiPaths.categories.list, "POST")
  },
  byId: {
    get: m(pathClient, adminApiPaths.categories.byId, "GET"),
    update: m(pathClient, adminApiPaths.categories.byId, "PUT"),
    remove: m(pathClient, adminApiPaths.categories.byId, "DELETE")
  }
});
