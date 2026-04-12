import type { EpisodeRequest } from "@cafedebug/api-client";

import type {
  EpisodeEditorFormValues,
  EpisodeMutationAction,
  EpisodeRecord
} from "./types/episode.types";

const toTrimmedValue = (value: string): string => value.trim();

const parseOptionalInteger = (value: string): number | undefined => {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isInteger(parsedValue) ? parsedValue : undefined;
};

const maybeString = (value: string): string | undefined => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const toTagsList = (value: string): string[] => {
  const tags = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(tags));
};

export const toEpisodeEditorDefaults = (
  episode: EpisodeRecord | null
): EpisodeEditorFormValues => {
  if (!episode) {
    return {
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
  }

  return {
    title: episode.title,
    shortDescription: episode.shortDescription,
    description: episode.description,
    url: episode.url,
    imageUrl: episode.imageUrl,
    tags: episode.tags.join(", "),
    publishedAt: episode.publishedAt,
    number: typeof episode.number === "number" ? String(episode.number) : "",
    categoryId: typeof episode.categoryId === "number" ? String(episode.categoryId) : ""
  };
};

export const toEpisodeRequestPayload = ({
  values,
  action
}: {
  values: EpisodeEditorFormValues;
  action: EpisodeMutationAction;
}): EpisodeRequest => {
  const title = toTrimmedValue(values.title);
  const shortDescription = toTrimmedValue(values.shortDescription);
  const description = values.description.trim();
  const url = toTrimmedValue(values.url);
  const imageUrl = toTrimmedValue(values.imageUrl);
  const publishedAt = toTrimmedValue(values.publishedAt);
  const number = parseOptionalInteger(values.number);
  const categoryId = parseOptionalInteger(values.categoryId);
  const tags = toTagsList(values.tags);

  const payload: EpisodeRequest = {
    title,
    active: action === "publish"
  };

  const normalizedPublishedAt =
    publishedAt || (action === "publish" ? new Date().toISOString() : "");

  const maybeShortDescription = maybeString(shortDescription);
  if (maybeShortDescription) {
    payload.shortDescription = maybeShortDescription;
  }

  const maybeDescription = maybeString(description);
  if (maybeDescription) {
    payload.description = maybeDescription;
  }

  const maybeUrl = maybeString(url);
  if (maybeUrl) {
    payload.url = maybeUrl;
  }

  const maybeImageUrl = maybeString(imageUrl);
  if (maybeImageUrl) {
    payload.imageUrl = maybeImageUrl;
  }

  if (tags.length > 0) {
    payload.tags = tags;
  }

  const maybePublishedAt = maybeString(normalizedPublishedAt);
  if (maybePublishedAt) {
    payload.publishedAt = maybePublishedAt;
  }

  if (typeof number === "number" && Number.isInteger(number)) {
    payload.number = number;
  }

  if (typeof categoryId === "number" && Number.isInteger(categoryId)) {
    payload.categoryId = categoryId;
  }

  return payload;
};
