import Link from "next/link";

import {
  ADMIN_SHELL_NAV_ITEMS,
  DISABLED_NAV_ENTRY_LABEL,
  isAdminShellNavItemActive,
  resolveAdminShellNavInteraction
} from "./admin-shell-nav-items.js";

type AdminShellSidebarProps = {
  pathname: string;
};

type AdminShellNavItemProps = {
  href: string;
  label: string;
  disabled: boolean;
  statusLabel?: string;
  pathname: string;
};

const navItemBaseClassName =
  "flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm font-medium";

function AdminShellNavItem({
  href,
  label,
  disabled,
  statusLabel,
  pathname
}: AdminShellNavItemProps) {
  const isActive = isAdminShellNavItemActive({ href, label, disabled }, pathname);
  const navInteraction = resolveAdminShellNavInteraction({ href, label, disabled });
  const navItemClassName = [
    navItemBaseClassName,
    isActive
      ? "bg-surface-container-high text-on-surface ring-1 ring-outline-variant"
      : "bg-surface-container text-on-surface",
    navInteraction.interactive
      ? "transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      : "cursor-not-allowed opacity-80"
  ].join(" ");

  const statusChip = statusLabel ? (
    <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-on-surface-variant">
      {statusLabel}
    </span>
  ) : null;

  if (!navInteraction.interactive) {
    return (
      <span
        aria-current={isActive ? "page" : undefined}
        aria-disabled={navInteraction.ariaDisabled}
        aria-label={`${label}. ${statusLabel ?? "Disabled"}. Navigation disabled in V1.`}
        className={navItemClassName}
        role="link"
        tabIndex={navInteraction.tabIndex}
      >
        <span>{label}</span>
        {statusChip}
        <span className="sr-only">
          Navigation disabled in V1. Route remains directly accessible.
        </span>
      </span>
    );
  }

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={navItemClassName}
      href={href}
    >
      <span>{label}</span>
      {statusChip}
    </Link>
  );
}

export function AdminShellSidebar({ pathname }: AdminShellSidebarProps) {
  return (
    <aside className="w-full rounded-xl bg-surface-container-low p-4 shadow-ambient md:sticky md:top-6 md:w-60 md:self-start">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          CafeDebug Admin
        </p>
      </div>
      <nav aria-label="Admin primary">
        <ul className="space-y-2">
          {ADMIN_SHELL_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <AdminShellNavItem {...item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-4 text-xs text-on-surface-variant">
        {DISABLED_NAV_ENTRY_LABEL}: Dashboard and Settings routes remain directly
        accessible but stay disabled in V1 navigation.
      </p>
    </aside>
  );
}
