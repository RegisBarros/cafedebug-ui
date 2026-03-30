const loginStatusMessages = {
  "session-required": "Please sign in to access the admin area.",
  "session-expired": "Your session expired. Sign in again to continue.",
  "session-check-failed":
    "We couldn't validate your session. Sign in to continue."
} as const;

export const resolveLoginStatusMessage = (
  reason: string | undefined
): string | undefined => {
  if (!reason) {
    return undefined;
  }

  if (reason in loginStatusMessages) {
    return loginStatusMessages[reason as keyof typeof loginStatusMessages];
  }

  return undefined;
};
