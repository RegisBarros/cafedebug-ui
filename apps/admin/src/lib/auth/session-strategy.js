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

const createRequestHeaders = (cookieHeader, includeJsonBody = false) => {
  const headers = {
    accept: "application/json"
  };

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  if (includeJsonBody) {
    headers["content-type"] = "application/json";
  }

  return headers;
};

const toAbsoluteUrl = (baseUrl, path) => {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
};

const readCookieValue = (cookieHeader, cookieName) => {
  const cookies = parseCookieHeader(cookieHeader);
  return cookies.get(cookieName);
};

const resolveRefreshToken = (cookieHeader, refreshCookieNames) => {
  for (const cookieName of refreshCookieNames) {
    const cookieValue = readCookieValue(cookieHeader, cookieName);

    if (typeof cookieValue === "string" && cookieValue.length > 0) {
      return cookieValue;
    }
  }

  return undefined;
};

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

  return Array.from(cookieMap.entries())
    .map(([cookieName, cookieValue]) => `${cookieName}=${cookieValue}`)
    .join("; ");
};

export const validateSessionWithSingleRefresh = async ({
  fetchImpl = fetch,
  baseUrl,
  cookieHeader,
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
      headers: createRequestHeaders(cookieHeader),
      cache: "no-store"
    });

    if (initialProbeResponse.status !== 401) {
      return {
        status: initialProbeResponse.ok ? "authenticated" : "unauthenticated",
        reason: initialProbeResponse.ok
          ? undefined
          : `probe-${initialProbeResponse.status}`,
        refreshAttempted: false,
        setCookieHeaders: []
      };
    }

    const refreshToken = resolveRefreshToken(cookieHeader, refreshCookieNames);
    const refreshRequestBody = refreshToken
      ? JSON.stringify({ refreshToken })
      : undefined;

    const refreshResponse = await fetchImpl(refreshUrl, {
      method: "POST",
      headers: createRequestHeaders(cookieHeader, Boolean(refreshRequestBody)),
      ...(refreshRequestBody ? { body: refreshRequestBody } : {}),
      cache: "no-store"
    });

    const refreshSetCookieHeaders = extractSetCookieHeaders(refreshResponse);

    if (!refreshResponse.ok) {
      return {
        status: "unauthenticated",
        reason: `refresh-${refreshResponse.status}`,
        refreshAttempted: true,
        setCookieHeaders: refreshSetCookieHeaders
      };
    }

    const retryCookieHeader = mergeCookieHeaderWithSetCookies(
      cookieHeader,
      refreshSetCookieHeaders
    );
    const retryProbeResponse = await fetchImpl(probeUrl, {
      method: "GET",
      headers: createRequestHeaders(retryCookieHeader),
      cache: "no-store"
    });

    return {
      status: retryProbeResponse.ok ? "authenticated" : "unauthenticated",
      reason: retryProbeResponse.ok
        ? undefined
        : `retry-${retryProbeResponse.status}`,
      refreshAttempted: true,
      setCookieHeaders: refreshSetCookieHeaders
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
