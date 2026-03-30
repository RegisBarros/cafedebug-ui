import Link from "next/link";

import { appRoutes } from "@/lib/routes";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
      <div className="space-y-4 rounded-xl bg-surface-container-low p-8 shadow-ambient">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">404</p>
        <h1 className="text-2xl font-semibold text-on-surface">Page not found</h1>
        <p className="text-sm text-on-surface-variant">The requested admin route does not exist yet.</p>
        <Link className="inline-flex rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface" href={appRoutes.episodes}>
          Back to episodes
        </Link>
      </div>
    </main>
  );
}
