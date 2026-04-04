import type { PathBasedClient } from "../../client";
import { adminApiPaths } from "../paths";

export const createImagesResource = (pathClient: PathBasedClient) => ({
  upload: pathClient[adminApiPaths.images.upload].POST,
  remove: pathClient[adminApiPaths.images.remove].POST
});
