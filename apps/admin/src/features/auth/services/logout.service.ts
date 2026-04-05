export type LogoutServiceResult = 
  | { ok: true }
  | { ok: false; error: string };

export const logoutService = async (): Promise<LogoutServiceResult> => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Logout failed with status ${response.status}`
      };
    }

    return { ok: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      error: errorMessage
    };
  }
};
