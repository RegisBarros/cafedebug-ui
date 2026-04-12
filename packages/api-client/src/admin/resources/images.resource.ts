import type { UploadImageRequest, DeleteImageRequest } from "../../generated/models";
import {
  postApiV1AdminImagesUpload,
  postApiV1AdminImagesDelete
} from "../../generated/admin-images/admin-images";

export const createImagesResource = () => ({
  upload: (body: UploadImageRequest, options?: RequestInit) =>
    postApiV1AdminImagesUpload(body, options),

  remove: (body: DeleteImageRequest, options?: RequestInit) =>
    postApiV1AdminImagesDelete(body, options)
});
