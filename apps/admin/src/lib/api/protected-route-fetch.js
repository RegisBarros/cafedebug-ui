const defaultRefreshPath = "/api/auth/refresh";

let inFlightRefreshRequest = null;

const resolvePathname = (input) => {
  if (input instanceof URL) {
    return input.pathname;
  }

  if (typeof input === "string") {
    try {
      return new URL(input, "http://localhost").pathname;
    } catch {
      return "";
    }
  }

  return "";
};

const isProtectedAdminApiRequest = (input) =>
  resolvePathname(input).startsWith("/api/admin/");

const requestSessionRefresh = async (refreshPath) => {
  if (!inFlightRefreshRequest) {
    inFlightRefreshRequest = fetch(refreshPath, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      }
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        inFlightRefreshRequest = null;
      });
  }

  return inFlightRefreshRequest;
};

/**
 * Fetches a protected admin route and retries once after session refresh on 401.
 *
 * @param {string | URL} input
 * @param {RequestInit=} init
 * @param {{
 *   retryOn401Once?: boolean;
 *   refreshPath?: string;
 * }=} options
 * @returns {Promise<Response>}
 */
export const fetchProtectedAdminRoute = async (
  input,
  init,
  options
) => {
  const {
    retryOn401Once = true,
    refreshPath = defaultRefreshPath
  } = options ?? {};

  const initialResponse = await fetch(input, init);

  if (
    !retryOn401Once ||
    initialResponse.status !== 401 ||
    !isProtectedAdminApiRequest(input)
  ) {
    return initialResponse;
  }

  const refreshSucceeded = await requestSessionRefresh(refreshPath);

  if (!refreshSucceeded) {
    return initialResponse;
  }

  return fetch(input, init);
};
