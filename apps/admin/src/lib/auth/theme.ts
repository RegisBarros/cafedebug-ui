import { cookies } from "next/headers";

export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE_NAME = "cafedebug_theme";
export const THEME_DEFAULT: Theme = "dark";
const VALID_THEMES: Theme[] = ["light", "dark", "system"];

export async function getThemeCookie(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;

  if (value && (VALID_THEMES as string[]).includes(value)) {
    return value as Theme;
  }

  return THEME_DEFAULT;
}

export function resolveDataTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return "dark";
  }
  return theme;
}
