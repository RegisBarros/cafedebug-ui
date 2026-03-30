import type { EpisodeEditorFormValues, EpisodesQueryParams } from "./types";

export const episodesListDefaultParams: EpisodesQueryParams = {
  page: 1,
  pageSize: 10,
  sortBy: "publishedAt",
  descending: true
};

export const episodeEditorDefaultValues: EpisodeEditorFormValues = {
  title: "",
  shortDescription: "",
  description: "",
  url: "",
  imageUrl: "",
  tags: "",
  publishedAt: "",
  number: "",
  categoryId: ""
};
