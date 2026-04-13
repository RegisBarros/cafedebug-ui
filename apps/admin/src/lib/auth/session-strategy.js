import {
  backendAuthHeaderModes,
  buildBackendAuthHeaders,
  parseCookieHeader,
  readRefreshTokenFromCookieHeader
} from "./backend-auth-headers.js";

const getCookieNameAndValue = (setCookieHeaderValue) => {
  const [cookieNameAndValue] = setCookieHeaderValue.split(";");

  if (!cookieNameAndValue) {
    return null;
  }

  const separatorIndex = cookieNameAndValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const cookieName = cookieNameAndValue.slice(0, separatorIndex).trim();
  const cookieValue = cookieNameAndValue.slice(separatorIndex + 1).trim();

  if (!cookieName) {
    return null;
  }

  return {
    cookieName,
    cookieValue
  };
};

const isCookieDeletionInstruction = (setCookieHeaderValue) => {
  const normalizedHeader = setCookieHeaderValue.toLowerCase();

  return (
    normalizedHeader.includes("max-age=0") ||
    normalizedHeader.includes("expires=thu, 01 jan 1970")
  );
};

const toAbsoluteUrl = (baseUrl, path) => {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : "/" + path;

  return normalizedBaseUrl + normalizedPath;
};

const isRecord = (value) => typeof value === "object" && value !== null;

const toNonEmptyString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
};

const toPositiveInteger = (value) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value > 0
    ? value
    : undefined;

const toCookieHeader = (cookieMap) =>
  Array.from(cookieMap.entries())
    .map(([cookieName, cookieValue]) => cookieName + "=" + cookieValue)
    .join("; ");

const parseTokenEnvelope = (payload) => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const accessToken = toNonEmptyString(payload.accessToken);
  const tokenType = toNonEmptyString(payload.tokenType);
  const expiresIn = toPositiveInteger(payload.expiresIn);

  if (!accessToken || !tokenType || tokenType.toLowerCase() !== "bearer") {
    return undefined;
  }

  if (!expiresIn) {
    return undefined;
  }

  const refreshTokenPayload = payload.refreshToken;

  if (!isRecord(refreshTokenPayload)) {
    return undefined;
  }

  const refreshToken = toNonEmptyString(refreshTokenPayload.token);
  const refreshTokenExpirationDate = toNonEmptyString(
    refreshTokenPayload.expirationDate
  );

  if (!refreshToken || !refreshTokenExpirationDate) {
    return undefined;
  }

  return {
    accessToken,
    refreshToken: {
      token: refreshToken,
      expirationDate: refreshTokenExpirationDate
    },
    tokenType: "Bearer",
    expiresIn
  };
};

const applyTokenEnvelopeToCookieHeader = (
  cookieHeader,
  tokenEnvelope,
  accessCookieNames,
  refreshCookieNames
) => {
  if (!tokenEnvelope) {
    return cookieHeader;
  }

  const cookieMap = parseCookieHeader(cookieHeader);
  const [primaryAccessCookieName] = accessCookieNames;
  const [primaryRefreshCookieName] = refreshCookieNames;

  if (typeof primaryAccessCookieName === "string" && primaryAccessCookieName) {
    cookieMap.set(primaryAccessCookieName, tokenEnvelope.accessToken);
  }

  if (typeof primaryRefreshCookieName === "string" && primaryRefreshCookieName) {
    cookieMap.set(primaryRefreshCookieName, tokenEnvelope.refreshToken.token);
  }

  return toCookieHeader(cookieMap);
};

export const splitSetCookieHeader = (combinedSetCookieHeader) => {
  if (!combinedSetCookieHeader) {
    return [];
  }

  const setCookieValues = [];
  let segmentStartIndex = 0;
  let parsingExpiresAttribute = false;

  for (let index = 0; index < combinedSetCookieHeader.length; index += 1) {
    const currentCharacter = combinedSetCookieHeader[index];

    if (currentCharacter === "=") {
      const attributeWindow = combinedSetCookieHeader
        .slice(Math.max(0, index - 7), index + 1)
        .toLowerCase();

      if (attributeWindow === "expires=") {
        parsingExpiresAttribute = true;
      }
    }

    if (parsingExpiresAttribute && currentCharacter === ";") {
      parsingExpiresAttribute = false;
    }

    if (currentCharacter === "," && !parsingExpiresAttribute) {
      const cookieValue = combinedSetCookieHeader
        .slice(segmentStartIndex, index)
        .trim();

      if (cookieValue) {
        setCookieValues.push(cookieValue);
      }

      segmentStartIndex = index + 1;
    }
  }

  const lastCookieValue = combinedSetCookieHeader.slice(segmentStartIndex).trim();

  if (lastCookieValue) {
    setCookieValues.push(lastCookieValue);
  }

  return setCookieValues;
};

export const extractSetCookieHeaders = (response) => {
  if (!response?.headers) {
    return [];
  }

  if (typeof response.headers.getSetCookie === "function") {
    const setCookieHeaders = response.headers.getSetCookie();

    if (Array.isArray(setCookieHeaders) && setCookieHeaders.length > 0) {
      return setCookieHeaders;
    }
  }

  const combinedSetCookieHeader = response.headers.get("set-cookie");

  return combinedSetCookieHeader
    ? splitSetCookieHeader(combinedSetCookieHeader)
    : [];
};

export const mergeCookieHeaderWithSetCookies = (cookieHeader, setCookieHeaders) => {
  const cookieMap = parseCookieHeader(cookieHeader);

  for (const setCookieHeader of setCookieHeaders) {
    const parsedCookie = getCookieNameAndValue(setCookieHeader);

    if (!parsedCookie) {
      continue;
    }

    if (isCookieDeletionInstruction(setCookieHeader)) {
      cookieMap.delete(parsedCookie.cookieName);
      continue;
    }

    cookieMap.set(parsedCookie.cookieName, parsedCookie.cookieValue);
  }

  return toCookieHeader(cookieMap);
};

const readJsonBody = async (response) => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const validateSessionWithSingleRefresh = async ({
  fetchImpl = fetch,
  baseUrl,
  cookieHeader,
  accessCookieNames,
  sessionProbePath,
  refreshPath,
  refreshCookieNames
}) => {
  if (!baseUrl) {
    return {
      status: "error",
      reason: "missing-api-base-url",
      refreshAttempted: false,
      setCookieHeaders: []
    };
  }

  const probeUrl = toAbsoluteUrl(baseUrl, sessionProbePath);
  const refreshUrl = toAbsoluteUrl(baseUrl, refreshPath);

  try {
    const initialProbeResponse = await fetchImpl(probeUrl, {
      method: "GET",
      headers: buildBackendAuthHeaders(cookieHeader, {
        mode: backendAuthHeaderModes.protected,
        accessCookieNames
      }),
      cache: "no-store"
    });

    if (initialProbeResponse.status !== 401) {
      return {
        status: initialProbeResponse.ok ? "authenticated" : "unauthenticated",
        reason: initialProbeResponse.ok
          ? undefined
          : "probe-" + initialProbeResponse.status,
        refreshAttempted: false,
        setCookieHeaders: []
      };
    }

    const refreshToken = readRefreshTokenFromCookieHeader(
      cookieHeader,
      refreshCookieNames
    );

    if (!refreshToken) {
      return {
        status: "unauthenticated",
        reason: "refresh-token-missing",
        refreshAttempted: false,
        setCookieHeaders: []
      };
    }

    const refreshResponse = await fetchImpl(refreshUrl, {
      method: "POST",
      headers: buildBackendAuthHeaders(cookieHeader, {
        mode: backendAuthHeaderModes.refresh
      }),
      body: JSON.stringify({ refreshToken }),
      cache: "no-store"
    });

    const refreshSetCookieHeaders = extractSetCookieHeaders(refreshResponse);

    if (!refreshResponse.ok) {
      return {
        status: "unauthenticated",
        reason: "refresh-" + refreshResponse.status,
        refreshAttempted: true,
        setCookieHeaders: refreshSetCookieHeaders
      };
    }

    const refreshPayload = await readJsonBody(refreshResponse);
    const tokenEnvelope = parseTokenEnvelope(refreshPayload);

    if (!tokenEnvelope) {
      return {
        status: "unauthenticated",
        reason: "refresh-invalid-payload",
        refreshAttempted: true,
        setCookieHeaders: refreshSetCookieHeaders
      };
    }

    const refreshedCookieHeader = mergeCookieHeaderWithSetCookies(
      cookieHeader,
      refreshSetCookieHeaders
    );
    const retryCookieHeader = applyTokenEnvelopeToCookieHeader(
      refreshedCookieHeader,
      tokenEnvelope,
      accessCookieNames,
      refreshCookieNames
    );
    const retryProbeResponse = await fetchImpl(probeUrl, {
      method: "GET",
      headers: buildBackendAuthHeaders(retryCookieHeader, {
        mode: backendAuthHeaderModes.protected,
        accessCookieNames
      }),
      cache: "no-store"
    });

    return {
      status: retryProbeResponse.ok ? "authenticated" : "unauthenticated",
      reason: retryProbeResponse.ok
        ? undefined
        : "retry-" + retryProbeResponse.status,
      refreshAttempted: true,
      setCookieHeaders: refreshSetCookieHeaders,
      ...(retryProbeResponse.ok ? { tokenEnvelope } : {})
    };
  } catch {
    return {
      status: "error",
      reason: "network-error",
      refreshAttempted: false,
      setCookieHeaders: []
    };
  }
};
