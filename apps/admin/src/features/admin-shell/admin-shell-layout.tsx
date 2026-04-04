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
  const showShellHeader = !(pathname === "/episodes" || pathname.startsWith("/episodes/"));

  return (
    <div className="flex min-h-screen">
        <AdminShellSidebar pathname={pathname} />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <section className="mx-auto flex w-full max-w-[1024px] flex-col gap-8 px-6 py-8 lg:px-8 lg:py-10">
            {showShellHeader ? <AdminShellHeader pathname={pathname} /> : null}
            {children}
          </section>
        </main>
    </div>
  );
}
