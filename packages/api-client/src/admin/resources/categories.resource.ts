import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createCategoriesResource = (pathClient: PathBasedClient) => ({
  list: {
    get: pathClient[adminApiPaths.categories.list].GET,
    create: pathClient[adminApiPaths.categories.list].POST
  },
  byId: {
    get: pathClient[adminApiPaths.categories.byId].GET,
    update: pathClient[adminApiPaths.categories.byId].PUT,
    remove: pathClient[adminApiPaths.categories.byId].DELETE
  }
});
