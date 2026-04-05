import { AdminShellLayout } from "@/features/admin-shell/admin-shell-layout";
import { getThemeCookie, resolveDataTheme } from "@/lib/auth/theme";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const theme = await getThemeCookie();
  const currentTheme = resolveDataTheme(theme);

  return <AdminShellLayout currentTheme={currentTheme}>{children}</AdminShellLayout>;
}
