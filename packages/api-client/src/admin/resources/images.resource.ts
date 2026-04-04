import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";
import { m } from "./utils";

export const createImagesResource = (pathClient: PathBasedClient) => ({
  upload: m(pathClient, adminApiPaths.images.upload, "POST"),
  remove: m(pathClient, adminApiPaths.images.remove, "POST")
});
