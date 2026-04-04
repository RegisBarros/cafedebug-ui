"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { EpisodeEditorSchemaValues } from "../schemas/episode.schema";
import type { AdminRouteError, EpisodeMutationAction } from "../types/episode.types";
import { EpisodeEditorTopBar } from "./episode-editor-topbar";

type EpisodeEditorFormProps = {
  activeAction: EpisodeMutationAction | null;
  activeStatus: boolean;
  form: UseFormReturn<EpisodeEditorSchemaValues>;
  isSubmitting: boolean;
  mode: "new" | "edit";
  onCancel: () => void;
  onSubmitAction: (action: EpisodeMutationAction) => () => void;
  submitError: AdminRouteError | null;
};

type EditorMode = "write" | "preview";
type MarkdownTransform = {
  nextValue: string;
  selectionEnd: number;
  selectionStart: number;
};

const splitTags = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const labelClassName =
  "text-sm font-semibold tracking-tight text-on-surface";

const inputClassName =
  "h-12 w-full rounded-full border border-outline-variant/70 bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-focus-ring placeholder:text-on-surface-variant/60";

const iconInputClassName =
  "h-12 w-full rounded-full border border-outline-variant/70 bg-surface-container-lowest pl-12 pr-4 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-focus-ring placeholder:text-on-surface-variant/60";

const metadataSectionClassName = "space-y-5 rounded-[1.75rem] bg-surface-container-low px-5 py-6";

export function EpisodeEditorForm({
  activeAction,
  activeStatus,
  form,
  isSubmitting,
  mode,
  onCancel,
  onSubmitAction,
  submitError
}: EpisodeEditorFormProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>("write");
  const [tagDraft, setTagDraft] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const imageUrlRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    setValue,
    watch,
    formState: { errors }
  } = form;
  const descriptionField = register("description");
  const imageUrlField = register("imageUrl");

  const description = watch("description");
  const imageUrl = watch("imageUrl");
  const tagsValue = watch("tags");
  const tags = useMemo(() => splitTags(tagsValue), [tagsValue]);

  useEffect(() => {
    setTagDraft("");
  }, [tagsValue]);

  const updateDescription = (
    transform: (value: string, selectionStart: number, selectionEnd: number) => MarkdownTransform
  ) => {
    const textarea = descriptionRef.current;
    const currentValue = form.getValues("description");
    const selectionStart = textarea?.selectionStart ?? currentValue.length;
    const selectionEnd = textarea?.selectionEnd ?? currentValue.length;
    const next = transform(currentValue, selectionStart, selectionEnd);

    setValue("description", next.nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });

    requestAnimationFrame(() => {
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    updateDescription((value, selectionStart, selectionEnd) => {
      const selected = value.slice(selectionStart, selectionEnd) || "text";
      const nextValue =
        value.slice(0, selectionStart) +
        prefix +
        selected +
        suffix +
        value.slice(selectionEnd);

      return {
        nextValue,
        selectionStart: selectionStart + prefix.length,
        selectionEnd: selectionStart + prefix.length + selected.length
      };
    });
  };

  const prefixLines = (formatter: (line: string, index: number) => string) => {
    updateDescription((value, selectionStart, selectionEnd) => {
      const selected = value.slice(selectionStart, selectionEnd) || "List item";
      const lines = selected.split("\n");
      const nextContent = lines.map((line, index) => formatter(line, index)).join("\n");
      const nextValue =
        value.slice(0, selectionStart) + nextContent + value.slice(selectionEnd);

      return {
        nextValue,
        selectionStart,
        selectionEnd: selectionStart + nextContent.length
      };
    });
  };

  const insertLink = () => {
    updateDescription((value, selectionStart, selectionEnd) => {
      const selected = value.slice(selectionStart, selectionEnd) || "Link text";
      const linkMarkup = `[${selected}](https://example.com)`;
      const nextValue = value.slice(0, selectionStart) + linkMarkup + value.slice(selectionEnd);

      return {
        nextValue,
        selectionStart: selectionStart + 1,
        selectionEnd: selectionStart + 1 + selected.length
      };
    });
  };

  const commitTag = () => {
    const nextTag = tagDraft.trim().replace(/,$/, "");

    if (!nextTag) {
      return;
    }

    const nextTags = Array.from(new Set([...tags, nextTag]));

    setValue("tags", nextTags.join(", "), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setTagDraft("");
  };

  const removeTag = (tagToRemove: string) => {
    const nextTags = tags.filter((tag) => tag !== tagToRemove);

    setValue("tags", nextTags.join(", "), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    commitTag();
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <EpisodeEditorTopBar
        active={mode === "edit" ? activeStatus : false}
        mode={mode}
        onBack={onCancel}
      />

      {submitError ? (
        <div className="border-b border-danger/30 bg-danger/10 px-6 py-3 lg:px-8 xl:px-10">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-danger">{submitError.title}</p>
            <p className="text-sm text-on-surface-variant">{submitError.detail}</p>
            {submitError.traceId ? (
              <p className="text-xs text-on-surface-variant">Trace ID: {submitError.traceId}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <form className="flex flex-1 flex-col" noValidate>
        <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <section className="bg-surface px-6 pb-32 pt-8 lg:px-8 xl:px-10 xl:pb-36 xl:pt-12">
            <div className="mx-auto flex max-w-[980px] flex-col gap-8">
              <div className="space-y-4">
                <input
                  aria-invalid={errors.title ? true : undefined}
                  className="w-full border-0 bg-transparent px-0 font-display text-4xl font-bold leading-[0.98] text-on-surface outline-none placeholder:text-on-surface-variant/35 focus:ring-0 md:text-5xl xl:text-[4rem]"
                  placeholder="Episode Title..."
                  type="text"
                  {...register("title")}
                />
                {errors.title?.message ? (
                  <p className="text-xs text-danger">{errors.title.message}</p>
                ) : null}

                <label className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Short Description
                  </span>
                  <textarea
                    aria-invalid={errors.shortDescription ? true : undefined}
                    className="min-h-24 w-full rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-low px-5 py-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/55 focus:border-primary focus:ring-2 focus:ring-focus-ring"
                    maxLength={240}
                    placeholder="Add a concise summary for episode cards and share surfaces."
                    {...register("shortDescription")}
                  />
                  {errors.shortDescription?.message ? (
                    <p className="text-xs text-danger">{errors.shortDescription.message}</p>
                  ) : null}
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <label className={labelClassName} htmlFor="episode-show-notes">
                    Show Notes
                  </label>

                  <div className="inline-flex rounded-full border border-outline-variant/60 bg-surface-container-low p-1">
                    <button
                      className={`inline-flex min-w-20 items-center justify-center rounded-full px-4 py-2 text-sm transition ${
                        editorMode === "write"
                          ? "bg-surface-container-lowest text-on-surface shadow-ambient"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        setEditorMode("write");
                      }}
                      type="button"
                    >
                      Write
                    </button>
                    <button
                      className={`inline-flex min-w-20 items-center justify-center rounded-full px-4 py-2 text-sm transition ${
                        editorMode === "preview"
                          ? "bg-surface-container-lowest text-on-surface shadow-ambient"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        setEditorMode("preview");
                      }}
                      type="button"
                    >
                      Preview
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-outline-variant/60 bg-surface-container-lowest shadow-ambient">
                  <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant/50 bg-surface-container-low px-4 py-3 text-on-surface-variant">
                    <button
                      aria-label="Bold"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        wrapSelection("**");
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        format_bold
                      </span>
                    </button>
                    <button
                      aria-label="Italic"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        wrapSelection("*");
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        format_italic
                      </span>
                    </button>
                    <span className="mx-1 h-6 w-px bg-outline-variant/70" />
                    <button
                      aria-label="Link"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        insertLink();
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        link
                      </span>
                    </button>
                    <button
                      aria-label="Quote"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        prefixLines((line) => `> ${line}`);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        format_quote
                      </span>
                    </button>
                    <button
                      aria-label="Code"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        wrapSelection("`");
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        code
                      </span>
                    </button>
                    <span className="mx-1 h-6 w-px bg-outline-variant/70" />
                    <button
                      aria-label="Bulleted List"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        prefixLines((line) => `- ${line}`);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        format_list_bulleted
                      </span>
                    </button>
                    <button
                      aria-label="Numbered List"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-surface-container-high hover:text-on-surface"
                      onClick={(event) => {
                        event.preventDefault();
                        prefixLines((line, index) => `${index + 1}. ${line}`);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        format_list_numbered
                      </span>
                    </button>
                  </div>

                  {editorMode === "write" ? (
                    <textarea
                      aria-invalid={errors.description ? true : undefined}
                      className="min-h-[520px] w-full resize-none border-0 bg-transparent px-5 py-6 font-mono text-[15px] leading-8 text-on-surface outline-none placeholder:text-on-surface-variant/45 focus:ring-0"
                      id="episode-show-notes"
                      placeholder="Write your show notes here using Markdown..."
                      {...descriptionField}
                      ref={(element) => {
                        descriptionField.ref(element);
                        descriptionRef.current = element;
                      }}
                    />
                  ) : (
                    <div className="min-h-[520px] px-5 py-6">
                      {description.trim().length > 0 ? (
                        <pre className="whitespace-pre-wrap font-mono text-[15px] leading-8 text-on-surface">
                          {description}
                        </pre>
                      ) : (
                        <p className="text-sm text-on-surface-variant">
                          Nothing to preview yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {errors.description?.message ? (
                  <p className="text-xs text-danger">{errors.description.message}</p>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="border-t border-outline-variant/60 bg-surface-container-lowest px-6 pb-32 pt-8 lg:px-8 xl:border-l xl:border-t-0 xl:px-10 xl:pb-36 xl:pt-10">
            <div className="flex flex-col gap-6">
              <section className={metadataSectionClassName}>
                <div className="flex flex-col gap-3">
                  <p className={labelClassName}>Cover Artwork</p>

                  <div className="flex flex-col gap-4 md:flex-row xl:flex-col">
                    <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[2rem] border border-dashed border-outline-variant/70 bg-surface">
                      {imageUrl.trim().length > 0 ? (
                        <img
                          alt="Episode cover preview"
                          className="h-full w-full object-cover"
                          src={imageUrl}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-on-surface-variant">
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-4xl"
                          >
                            image
                          </span>
                          <p className="text-sm font-medium">Paste a cover image URL</p>
                          <p className="text-xs text-on-surface-variant/70">
                            Recommended 3000x3000 JPG/PNG
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 xl:max-w-[280px]">
                      <button
                        className="inline-flex h-12 items-center justify-center rounded-full border border-outline-variant/70 px-5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={(event) => {
                          event.preventDefault();
                          imageUrlRef.current?.focus();
                        }}
                        type="button"
                      >
                        Choose Image
                      </button>
                      <p className="text-sm leading-6 text-on-surface-variant">
                        Recommended: 3000x3000px. Format: JPG or PNG.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                    Cover Image URL
                  </span>
                  <input
                    aria-invalid={errors.imageUrl ? true : undefined}
                    className={inputClassName}
                    placeholder="https://cafedebug-uploads..."
                    type="url"
                    {...imageUrlField}
                    ref={(element) => {
                      imageUrlField.ref(element);
                      imageUrlRef.current = element;
                    }}
                  />
                  {errors.imageUrl?.message ? (
                    <p className="text-xs text-danger">{errors.imageUrl.message}</p>
                  ) : null}
                </label>
              </section>

              <section className={metadataSectionClassName}>
                <label className="flex flex-col gap-2">
                  <span className={labelClassName}>Audio URL</span>
                  <span className="relative block">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
                    >
                      link
                    </span>
                    <input
                      aria-invalid={errors.url ? true : undefined}
                      className={iconInputClassName}
                      placeholder="https://omny.fm/shows/..."
                      type="url"
                      {...register("url")}
                    />
                  </span>
                  {errors.url?.message ? (
                    <p className="text-xs text-danger">{errors.url.message}</p>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2">
                  <span className={labelClassName}>Category ID</span>
                  <input
                    aria-invalid={errors.categoryId ? true : undefined}
                    className={inputClassName}
                    inputMode="numeric"
                    placeholder="1"
                    type="text"
                    {...register("categoryId")}
                  />
                  {errors.categoryId?.message ? (
                    <p className="text-xs text-danger">{errors.categoryId.message}</p>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2">
                  <span className={labelClassName}>Publish Date</span>
                  <span className="relative block">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
                    >
                      calendar_today
                    </span>
                    <input
                      aria-invalid={errors.publishedAt ? true : undefined}
                      className={iconInputClassName}
                      type="datetime-local"
                      {...register("publishedAt")}
                    />
                  </span>
                  {errors.publishedAt?.message ? (
                    <p className="text-xs text-danger">{errors.publishedAt.message}</p>
                  ) : null}
                </label>

                <div className="flex flex-col gap-3">
                  <span className={labelClassName}>Tags</span>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                          key={tag}
                        >
                          {tag}
                          <button
                            aria-label={`Remove ${tag}`}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-primary transition hover:text-primary-strong"
                            onClick={(event) => {
                              event.preventDefault();
                              removeTag(tag);
                            }}
                            type="button"
                          >
                            <span
                              aria-hidden="true"
                              className="material-symbols-outlined text-[14px]"
                            >
                              close
                            </span>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <input
                    className={inputClassName}
                    onBlur={commitTag}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag and press enter..."
                    type="text"
                    value={tagDraft}
                  />
                  {errors.tags?.message ? (
                    <p className="text-xs text-danger">{errors.tags.message}</p>
                  ) : (
                    <p className="text-xs text-on-surface-variant">
                      Press enter to add keywords.
                    </p>
                  )}
                </div>
              </section>

              <section className={metadataSectionClassName}>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="flex flex-col gap-2">
                    <span className={labelClassName}>Episode Number</span>
                    <input
                      aria-invalid={errors.number ? true : undefined}
                      className={inputClassName}
                      inputMode="numeric"
                      placeholder="13"
                      type="text"
                      {...register("number")}
                    />
                    {errors.number?.message ? (
                      <p className="text-xs text-danger">{errors.number.message}</p>
                    ) : null}
                  </label>
                </div>
              </section>
            </div>
          </aside>
        </div>

        <footer className="sticky bottom-0 z-20 mt-auto border-t border-outline-variant/60 bg-surface-container-lowest/95 px-6 py-5 backdrop-blur lg:px-8 xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface"
              onClick={(event) => {
                event.preventDefault();
                onCancel();
              }}
              type="button"
            >
              Cancel
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex h-12 items-center justify-center rounded-full border border-outline-variant/70 px-6 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={(event) => {
                  event.preventDefault();
                  onSubmitAction("save-draft")();
                }}
                type="button"
              >
                {isSubmitting && activeAction === "save-draft"
                  ? "Saving Draft..."
                  : "Save Draft"}
              </button>

              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-on-primary transition hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onClick={(event) => {
                  event.preventDefault();
                  onSubmitAction("publish")();
                }}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  send
                </span>
                {isSubmitting && activeAction === "publish" ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
