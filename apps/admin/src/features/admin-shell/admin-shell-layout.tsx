"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShellHeader } from "./admin-shell-header";
import { AdminShellSidebar } from "./admin-shell-sidebar";

type AdminShellLayoutProps = {
  children: ReactNode;
};

export function AdminShellLayout({ children }: AdminShellLayoutProps) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-6 md:flex-row md:gap-8">
        <AdminShellSidebar pathname={pathname} />

        <main className="min-w-0 flex-1 space-y-4">
          <AdminShellHeader pathname={pathname} />

          <section className="space-y-4">{children}</section>
        </main>
      </div>
    </div>
  );
}
