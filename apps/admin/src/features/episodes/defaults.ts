import type { EpisodeEditorFormValues, EpisodesQueryParams } from "./types/episode.types";

export const episodesListDefaultParams: EpisodesQueryParams = {
  page: 1,
  pageSize: 5,
  sortBy: "number",
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
