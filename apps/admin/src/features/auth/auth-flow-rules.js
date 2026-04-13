import { appRoutes } from "../../lib/routes.js";

const normalizePathname = (pathname) => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export const AUTH_FLOW_ROUTES = Object.freeze({
  login: appRoutes.login,
  postLogin: appRoutes.episodes,
  protectedPrefixes: [
    appRoutes.dashboard,
    appRoutes.episodes,
    appRoutes.settings
  ]
});

export const LOGIN_ROUTE = AUTH_FLOW_ROUTES.login;
export const POST_LOGIN_REDIRECT_ROUTE = AUTH_FLOW_ROUTES.postLogin;

export const isProtectedAdminPath = (pathname) => {
  const normalizedPathname = normalizePathname(pathname);

  return AUTH_FLOW_ROUTES.protectedPrefixes.some(
    (protectedPrefix) =>
      normalizedPathname === protectedPrefix ||
      normalizedPathname.startsWith(`${protectedPrefix}/`)
  );
};

export const getRouteProtectionRedirect = ({ pathname, isAuthenticated }) => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === LOGIN_ROUTE && isAuthenticated) {
    return POST_LOGIN_REDIRECT_ROUTE;
  }

  if (isProtectedAdminPath(normalizedPathname) && !isAuthenticated) {
    return LOGIN_ROUTE;
  }

  return null;
};

export const shouldAttemptSingleRefresh = ({
  status,
  hasAttemptedRefresh,
  canRefresh
}) => status === 401 && !hasAttemptedRefresh && canRefresh;
