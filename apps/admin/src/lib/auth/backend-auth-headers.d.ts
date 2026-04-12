export declare const backendAuthHeaderModes: Readonly<{
  protected: "protected";
  refresh: "refresh";
}>;

export declare const parseCookieHeader: (
  cookieHeader: string
) => Map<string, string>;

export declare const readFirstMatchingCookieValue: (
  cookieHeader: string,
  cookieNames: string[]
) => string | undefined;

export declare const readAccessTokenFromCookieHeader: (
  cookieHeader: string,
  accessCookieNames: string[]
) => string | undefined;

export declare const resolveAccessTokenFromCookieHeader: (
  cookieHeader: string,
  accessCookieNames: string[]
) => string | undefined;

export declare const readRefreshTokenFromCookieHeader: (
  cookieHeader: string,
  refreshCookieNames: string[]
) => string | undefined;

export type BackendAuthHeaderMode = keyof typeof backendAuthHeaderModes;

export declare const buildBackendAuthHeaders: (
  cookieHeader: string,
  options?: {
    mode?: BackendAuthHeaderMode;
    accessCookieNames?: string[];
  }
) => Record<string, string>;
