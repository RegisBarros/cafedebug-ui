import type { BannerRequest, GetApiV1AdminBannersParams } from "../../generated/models";
import {
  getApiV1AdminBanners,
  getApiV1AdminBannersId,
  postApiV1AdminBanners,
  putApiV1AdminBannersId,
  deleteApiV1AdminBannersId
} from "../../generated/admin-banners/admin-banners";

export const createBannersResource = () => ({
  list: (params?: GetApiV1AdminBannersParams, options?: RequestInit) =>
    getApiV1AdminBanners(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1AdminBannersId(id, options),

  create: (body: BannerRequest, options?: RequestInit) =>
    postApiV1AdminBanners(body, options),

  update: (id: number, body: BannerRequest, options?: RequestInit) =>
    putApiV1AdminBannersId(id, body, options),

  remove: (id: number, options?: RequestInit) =>
    deleteApiV1AdminBannersId(id, options)
});
