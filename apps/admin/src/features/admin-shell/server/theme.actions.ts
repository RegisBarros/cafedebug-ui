"use server";

import { cookies } from "next/headers";

import { THEME_COOKIE_NAME, type Theme } from "@/lib/auth/theme";

const VALID_THEMES: Theme[] = ["light", "dark", "system"];

export async function setThemeAction(theme: Theme): Promise<void> {
  if (!(VALID_THEMES as string[]).includes(theme)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
}
