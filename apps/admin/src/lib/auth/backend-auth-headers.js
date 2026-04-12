export const backendAuthHeaderModes = Object.freeze({
  protected: "protected",
  refresh: "refresh"
});

/**
 * @param {string} cookieHeader
 * @returns {Map<string, string>}
 */
export const parseCookieHeader = (cookieHeader) => {
  const cookieMap = new Map();

  if (!cookieHeader) {
    return cookieMap;
  }

  for (const chunk of cookieHeader.split(";")) {
    const separatorIndex = chunk.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const cookieName = chunk.slice(0, separatorIndex).trim();
    const cookieValue = chunk.slice(separatorIndex + 1).trim();

    if (!cookieName) {
      continue;
    }

    cookieMap.set(cookieName, cookieValue);
  }

  return cookieMap;
};

/**
 * @param {string} cookieHeader
 * @param {string[]} cookieNames
 * @returns {string|undefined}
 */
export const readFirstMatchingCookieValue = (cookieHeader, cookieNames) => {
  const cookieMap = parseCookieHeader(cookieHeader);

  for (const cookieName of cookieNames) {
    const cookieValue = cookieMap.get(cookieName);

    if (typeof cookieValue === "string" && cookieValue.length > 0) {
      return cookieValue;
    }
  }

  return undefined;
};

/**
 * @param {string} cookieHeader
 * @param {string[]} accessCookieNames
 * @returns {string|undefined}
 */
export const readAccessTokenFromCookieHeader = (
  cookieHeader,
  accessCookieNames
) => readFirstMatchingCookieValue(cookieHeader, accessCookieNames);

export const resolveAccessTokenFromCookieHeader = readAccessTokenFromCookieHeader;

/**
 * @param {string} cookieHeader
 * @param {string[]} refreshCookieNames
 * @returns {string|undefined}
 */
export const readRefreshTokenFromCookieHeader = (
  cookieHeader,
  refreshCookieNames
) => readFirstMatchingCookieValue(cookieHeader, refreshCookieNames);

/**
 * @param {string} cookieHeader
 * @param {{
 *   mode?: "protected" | "refresh";
 *   accessCookieNames?: string[];
 * }} [options]
 * @returns {Record<string, string>}
 */
export const buildBackendAuthHeaders = (cookieHeader, options = {}) => {
  const {
    mode = backendAuthHeaderModes.protected,
    accessCookieNames = []
  } = options;

  if (mode === backendAuthHeaderModes.refresh) {
    return {
      accept: "application/json",
      "content-type": "application/json"
    };
  }

  const headers = {
    accept: "application/json"
  };

  const accessToken = readAccessTokenFromCookieHeader(
    cookieHeader,
    accessCookieNames
  );

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};
