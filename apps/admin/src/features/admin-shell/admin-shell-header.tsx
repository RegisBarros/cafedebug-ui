import { getAdminShellRouteContext } from "./admin-shell-nav-items.js";

type AdminShellHeaderProps = {
  pathname: string;
};

export function AdminShellHeader({ pathname }: AdminShellHeaderProps) {
  const routeContext = getAdminShellRouteContext(pathname);

  return (
    <header className="rounded-xl bg-surface-container-low p-4 shadow-ambient">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Admin workspace
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-lg font-semibold text-on-surface">{routeContext.title}</p>
        {routeContext.disabledInV1 ? (
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-on-surface-variant">
            Coming soon
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">{routeContext.description}</p>
    </header>
  );
}
