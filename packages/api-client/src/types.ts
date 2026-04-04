import type { NormalizedApiError } from "./errors";

export type OpenApiResponse<TData> =
  | { data: TData; response: Response }
  | { error: unknown; response: Response };

export type NormalizedClientResponse<TData> =
  | { data: TData; response: Response }
  | { error: NormalizedApiError; response: Response };
