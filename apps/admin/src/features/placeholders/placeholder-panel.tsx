import Link from "next/link";
import type { ReactNode } from "react";

type PlaceholderAction = {
  href: string;
  label: string;
};

type PlaceholderPanelProps = {
  title: string;
  description: string;
  status?: string;
  actions?: PlaceholderAction[];
  children?: ReactNode;
};

export function PlaceholderPanel({
  title,
  description,
  status,
  actions,
  children
}: PlaceholderPanelProps) {
  return (
    <section className="space-y-6 rounded-xl bg-surface-container-low p-6 shadow-ambient">
      <header className="space-y-3">
        {status ? (
          <span className="inline-flex rounded-full bg-primary-container px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface">
            {status}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold text-on-surface">{title}</h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">{description}</p>
      </header>

      {children ? <div className="space-y-4">{children}</div> : null}

      {actions?.length ? (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-highest"
              href={action.href}
              key={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
