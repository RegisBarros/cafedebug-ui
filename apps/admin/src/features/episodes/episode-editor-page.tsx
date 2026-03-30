"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { appRoutes } from "@/lib/routes";
import { logger, observabilityEvents } from "@/lib/observability";
import {
  createEpisodeEditorTelemetryHooks,
  trackApiFailure
} from "@/lib/observability/telemetry";

import {
  createEpisode,
  episodesQueryKeys,
  fetchEpisodeById,
  updateEpisode
} from "./client";
import { episodeEditorDefaultValues } from "./defaults";
import { episodeEditorSchema, type EpisodeEditorSchemaValues } from "./schema";
import { toEpisodeRequestPayload, toEpisodeEditorDefaults } from "./transformers";
import type {
  AdminRouteError,
  EpisodeMutationAction,
  EpisodeRecord,
  EpisodesMutationResult
} from "./types";

type EpisodeEditorMode = "new" | "edit";

type EpisodeEditorPageProps = {
  mode: EpisodeEditorMode;
  id?: string;
};

type EditorMutationError = AdminRouteError;

const parseEpisodeId = (id: string | undefined): number | null => {
  if (!id) {
    return null;
  }

  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const normalizeError = (error: unknown): AdminRouteError => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "title" in error &&
    "detail" in error
  ) {
    return error as AdminRouteError;
  }

  return {
    status: 500,
    title: "Request Failed",
    detail: "Unable to complete this operation."
  };
};

const toTelemetryReason = (error: AdminRouteError): string =>
  `${error.status}:${error.title}`;

const toPageTitle = (mode: EpisodeEditorMode, episode?: EpisodeRecord | null): string => {
  if (mode === "new") {
    return "Create episode";
  }

  if (episode?.title) {
    return `Edit episode — ${episode.title}`;
  }

  return "Edit episode";
};

const formatDateInputValue = (value: string): string => {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");
  const hour = String(parsedDate.getUTCHours()).padStart(2, "0");
  const minute = String(parsedDate.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toIsoDateTimeValue = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return trimmedValue;
  }

  return parsedDate.toISOString();
};

export function EpisodeEditorPage({ mode, id }: EpisodeEditorPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const episodeId = parseEpisodeId(id);
  const [submitError, setSubmitError] = useState<EditorMutationError | null>(null);
  const [activeAction, setActiveAction] = useState<EpisodeMutationAction | null>(null);
  const [hasPendingNavigation, setHasPendingNavigation] = useState(false);
  const telemetry = useMemo(
    () => createEpisodeEditorTelemetryHooks(mode === "new" ? "create" : "edit"),
    [mode]
  );

  const episodeQuery = useQuery({
    queryKey: episodeId ? episodesQueryKeys.detail(episodeId) : ["episode", "new"],
    queryFn: async () => {
      if (!episodeId) {
        return null;
      }

      return fetchEpisodeById(episodeId);
    },
    enabled: mode === "edit" && Boolean(episodeId)
  });

  const form = useForm<EpisodeEditorSchemaValues>({
    resolver: zodResolver(episodeEditorSchema),
    defaultValues: episodeEditorDefaultValues
  });

  useEffect(() => {
    if (!episodeQuery.data) {
      return;
    }

    form.reset({
      ...toEpisodeEditorDefaults(episodeQuery.data),
      publishedAt: formatDateInputValue(episodeQuery.data.publishedAt)
    });
  }, [episodeQuery.data, form]);

  useEffect(() => {
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty || hasPendingNavigation) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [form.formState.isDirty, hasPendingNavigation]);

  const saveMutation = useMutation<
    EpisodesMutationResult,
    AdminRouteError,
    {
      values: EpisodeEditorSchemaValues;
      action: EpisodeMutationAction;
    }
  >({
    mutationFn: async ({
      values,
      action
    }: {
      values: EpisodeEditorSchemaValues;
      action: EpisodeMutationAction;
    }) => {
      const payload = toEpisodeRequestPayload({
        values: {
          ...values,
          publishedAt: toIsoDateTimeValue(values.publishedAt)
        },
        action
      });

      if (mode === "new") {
        return createEpisode(payload);
      }

      if (!episodeId) {
        throw {
          status: 400,
          title: "Bad Request",
          detail: "Invalid episode id."
        } satisfies AdminRouteError;
      }

      return updateEpisode({
        id: episodeId,
        payload
      });
    },
    onSuccess: async (_result, { action }) => {
      await queryClient.invalidateQueries({
        queryKey: episodesQueryKeys.all
      });

      if (episodeId) {
        await queryClient.invalidateQueries({
          queryKey: episodesQueryKeys.detail(episodeId)
        });
      }

      setSubmitError(null);
      setActiveAction(null);

      if (action === "publish") {
        telemetry.onPublishSuccess({
          status: mode === "new" ? 201 : 200
        });
      } else {
        telemetry.onSaveDraftSuccess({
          status: mode === "new" ? 201 : 200
        });
      }

      if (mode === "new") {
        form.reset(episodeEditorDefaultValues);
        router.replace(appRoutes.episodes);
        router.refresh();
        return;
      }

      form.reset(form.getValues());
      router.refresh();
    },
    onError: (error, { action }) => {
      const normalizedError = normalizeError(error);
      const reason = toTelemetryReason(normalizedError);

      setSubmitError(normalizedError);
      setActiveAction(null);

      trackApiFailure({
        module: "episodes",
        action: mode === "new" ? "create" : "update",
        endpoint:
          mode === "new"
            ? "/api/admin/episodes"
            : "/api/admin/episodes/{id}",
        method: mode === "new" ? "POST" : "PUT",
        error: normalizedError,
        fallbackStatus: normalizedError.status,
        ...(normalizedError.traceId ? { traceId: normalizedError.traceId } : {})
      });

      if (action === "publish") {
        telemetry.onPublishFailure({
          status: normalizedError.status,
          ...(normalizedError.traceId ? { traceId: normalizedError.traceId } : {}),
          reason
        });
      } else {
        telemetry.onSaveDraftFailure({
          status: normalizedError.status,
          ...(normalizedError.traceId ? { traceId: normalizedError.traceId } : {}),
          reason
        });
      }
    }
  });

  const onSubmit = (action: EpisodeMutationAction) =>
    form.handleSubmit((values) => {
      setSubmitError(null);
      setActiveAction(action);
      saveMutation.mutate({ values, action });
    });

  const handleNavigateBack = () => {
    if (form.formState.isDirty) {
      const shouldLeave = window.confirm(
        "You have unsaved changes. Leave this editor without saving?"
      );

      if (!shouldLeave) {
        return;
      }
    }

    setHasPendingNavigation(true);
    router.push(appRoutes.episodes);
  };

  const editorLoadError =
    episodeQuery.error && mode === "edit"
      ? normalizeError(episodeQuery.error)
      : null;

  useEffect(() => {
    if (!editorLoadError) {
      return;
    }

    logger.warn(observabilityEvents.apiRequestFailed, {
      module: "episodes",
      action: "detail",
      status: editorLoadError.status,
      ...(editorLoadError.traceId ? { traceId: editorLoadError.traceId } : {})
    });
  }, [editorLoadError]);

  if (mode === "edit" && !episodeId) {
    return (
      <section className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-ambient">
        <h1 className="text-2xl font-semibold text-on-surface">Invalid episode id</h1>
        <p className="text-sm text-on-surface-variant">
          The requested episode id is invalid.
        </p>
        <Link
          className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
          href={appRoutes.episodes}
        >
          Back to episodes
        </Link>
      </section>
    );
  }

  if (mode === "edit" && episodeQuery.isLoading) {
    return (
      <section className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-ambient">
        <h1 className="text-2xl font-semibold text-on-surface">Loading episode...</h1>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-3 rounded-lg bg-surface-container p-4">
            <span className="block h-4 w-48 animate-pulse rounded bg-surface-container-high" />
            <span className="block h-24 w-full animate-pulse rounded bg-surface-container-high" />
          </div>
          <div className="space-y-3 rounded-lg bg-surface-container p-4">
            <span className="block h-4 w-40 animate-pulse rounded bg-surface-container-high" />
            <span className="block h-36 w-full animate-pulse rounded bg-surface-container-high" />
          </div>
        </div>
      </section>
    );
  }

  if (mode === "edit" && editorLoadError) {
    return (
      <section className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-ambient">
        <h1 className="text-2xl font-semibold text-on-surface">{editorLoadError.title}</h1>
        <p className="text-sm text-on-surface-variant">{editorLoadError.detail}</p>
        {editorLoadError.traceId ? (
          <p className="text-xs text-on-surface-variant">
            Trace ID: <code>{editorLoadError.traceId}</code>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary"
            onClick={() => episodeQuery.refetch()}
            type="button"
          >
            Retry
          </button>
          <button
            className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
            onClick={handleNavigateBack}
            type="button"
          >
            Back to episodes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-ambient">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Episode editor
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">
            {toPageTitle(mode, episodeQuery.data)}
          </h1>
        </div>

        <button
          className="inline-flex h-10 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
          onClick={handleNavigateBack}
          type="button"
        >
          Back to episodes
        </button>
      </header>

      {submitError ? (
        <div className="space-y-1 rounded-lg border border-danger bg-surface-container p-4">
          <p className="text-sm font-semibold text-danger">{submitError.title}</p>
          <p className="text-sm text-on-surface-variant">{submitError.detail}</p>
          {submitError.traceId ? (
            <p className="text-xs text-on-surface-variant">
              Trace ID: <code>{submitError.traceId}</code>
            </p>
          ) : null}
        </div>
      ) : null}

      <form className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-lg bg-surface-container p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Title</span>
              <input
                className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("title")}
                placeholder="Episode title"
                type="text"
              />
              {form.formState.errors.title?.message ? (
                <p className="text-xs text-danger">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">
                Short description
              </span>
              <textarea
                className="min-h-24 w-full rounded-lg bg-surface-container-highest px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("shortDescription")}
                placeholder="Brief summary shown in list cards"
              />
              {form.formState.errors.shortDescription?.message ? (
                <p className="text-xs text-danger">
                  {form.formState.errors.shortDescription.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Description</span>
              <textarea
                className="min-h-52 w-full rounded-lg bg-surface-container-highest px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("description")}
                placeholder="Long-form notes (markdown supported by backend field)."
              />
              {form.formState.errors.description?.message ? (
                <p className="text-xs text-danger">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </label>
          </div>

          <aside className="space-y-4 rounded-lg bg-surface-container p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Audio URL</span>
              <input
                className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("url")}
                placeholder="https://..."
                type="url"
              />
              {form.formState.errors.url?.message ? (
                <p className="text-xs text-danger">{form.formState.errors.url.message}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Cover image URL</span>
              <input
                className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("imageUrl")}
                placeholder="https://..."
                type="url"
              />
              {form.formState.errors.imageUrl?.message ? (
                <p className="text-xs text-danger">
                  {form.formState.errors.imageUrl.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">Tags</span>
              <input
                className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("tags")}
                placeholder="react, architecture, web"
                type="text"
              />
              {form.formState.errors.tags?.message ? (
                <p className="text-xs text-danger">{form.formState.errors.tags.message}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-on-surface">
                Publish datetime
              </span>
              <input
                className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                {...form.register("publishedAt")}
                type="datetime-local"
              />
              {form.formState.errors.publishedAt?.message ? (
                <p className="text-xs text-danger">
                  {form.formState.errors.publishedAt.message}
                </p>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-on-surface">Episode #</span>
                <input
                  className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                  {...form.register("number")}
                  inputMode="numeric"
                  placeholder="120"
                  type="text"
                />
                {form.formState.errors.number?.message ? (
                  <p className="text-xs text-danger">
                    {form.formState.errors.number.message}
                  </p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-on-surface">Category ID</span>
                <input
                  className="h-11 w-full rounded-lg bg-surface-container-highest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-focus-ring"
                  {...form.register("categoryId")}
                  inputMode="numeric"
                  placeholder="1"
                  type="text"
                />
                {form.formState.errors.categoryId?.message ? (
                  <p className="text-xs text-danger">
                    {form.formState.errors.categoryId.message}
                  </p>
                ) : null}
              </label>
            </div>
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-3 rounded-lg bg-surface-container p-4">
          <button
            className="inline-flex h-11 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
            onClick={(event) => {
              event.preventDefault();
              handleNavigateBack();
            }}
            type="button"
          >
            Cancel
          </button>

          <button
            className="inline-flex h-11 items-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saveMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              onSubmit("save-draft")();
            }}
            type="button"
          >
            {saveMutation.isPending && activeAction === "save-draft"
              ? "Saving draft..."
              : "Save draft"}
          </button>

          <button
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saveMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              onSubmit("publish")();
            }}
            type="button"
          >
            {saveMutation.isPending && activeAction === "publish"
              ? "Publishing..."
              : "Publish"}
          </button>
        </footer>
      </form>
    </section>
  );
}
