export type FetcherConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
};

let _baseUrl = "";
let _fetchFn: typeof globalThis.fetch = globalThis.fetch;

export const configureFetcher = (options: FetcherConfig) => {
  _baseUrl = options.baseUrl.replace(/\/$/, "");
  if (options.fetch) _fetchFn = options.fetch;
};

export const getBaseUrl = () => _baseUrl;

/**
 * Custom fetch mutator for Orval-generated endpoint functions.
 *
 * Orval calls this as `customFetch<ResponseType>(url, init)` where
 * ResponseType is a discriminated union like:
 *   { data: SuccessBody; status: 200; headers: Headers }
 * | { data: ErrorBody;   status: 4xx; headers: Headers }
 *
 * The function always returns `{ data, status, headers }` so callers
 * can discriminate on `status` to distinguish success from error.
 */
export const customFetch = async <T>(
  url: string | URL | Request,
  init?: RequestInit
): Promise<T> => {
  const fullUrl = typeof url === "string" ? _baseUrl + url : url;

  const response = await _fetchFn(
    fullUrl as string | URL | Request,
    init
  );

  const text = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();

  const data = text ? JSON.parse(text) : {};

  return { data, status: response.status, headers: response.headers } as T;
};

export default customFetch;
