import type { NormalizedApiError, EpisodeRequest } from "@cafedebug/api-client";

export type EpisodeRequestPayload = EpisodeRequest;

export type EpisodeRecord = {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  url: string;
  imageUrl: string;
  tags: string[];
  publishedAt: string;
  active: boolean;
  number: number | null;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type EpisodesQueryParams = {
  page: number;
  pageSize: number;
  sortBy: string;
  descending: boolean;
};

export type EpisodesPageData = {
  items: EpisodeRecord[];
  page: number;
  pageSize: number;
  pageCount: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  sortBy: string;
  descending: boolean;
};

export type EpisodeEditorFormValues = {
  title: string;
  shortDescription: string;
  description: string;
  url: string;
  imageUrl: string;
  tags: string;
  publishedAt: string;
  number: string;
  categoryId: string;
};

export type EpisodeMutationAction = "save-draft" | "publish";

export type EpisodesMutationResult = {
  id?: number;
};

export type AdminRouteError = NormalizedApiError;
