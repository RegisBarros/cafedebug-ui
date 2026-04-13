import type { GetApiV1PublicBannersParams } from "../../generated/models";
import {
  getApiV1PublicBanners,
  getApiV1PublicBannersId,
  getApiV1PublicBannersBannerName
} from "../../generated/public-banners/public-banners";

export const createPublicBannersResource = () => ({
  list: (params?: GetApiV1PublicBannersParams, options?: RequestInit) =>
    getApiV1PublicBanners(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1PublicBannersId(id, options),

  getByName: (bannerName: string, options?: RequestInit) =>
    getApiV1PublicBannersBannerName(bannerName, options)
});
