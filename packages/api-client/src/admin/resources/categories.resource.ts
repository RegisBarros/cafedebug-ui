import type { CategoryRequest, GetApiV1AdminCategoriesParams } from "../../generated/models";
import {
  getApiV1AdminCategories,
  getApiV1AdminCategoriesId,
  postApiV1AdminCategories,
  putApiV1AdminCategoriesId,
  deleteApiV1AdminCategoriesId
} from "../../generated/admin-categories/admin-categories";

export const createCategoriesResource = () => ({
  list: (params?: GetApiV1AdminCategoriesParams, options?: RequestInit) =>
    getApiV1AdminCategories(params, options),

  get: (id: number, options?: RequestInit) =>
    getApiV1AdminCategoriesId(id, options),

  create: (body: CategoryRequest, options?: RequestInit) =>
    postApiV1AdminCategories(body, options),

  update: (id: number, body: CategoryRequest, options?: RequestInit) =>
    putApiV1AdminCategoriesId(id, body, options),

  remove: (id: number, options?: RequestInit) =>
    deleteApiV1AdminCategoriesId(id, options)
});
