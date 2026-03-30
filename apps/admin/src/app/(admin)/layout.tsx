import { AdminShellLayout } from "@/features/admin-shell/admin-shell-layout";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShellLayout>{children}</AdminShellLayout>;
}
