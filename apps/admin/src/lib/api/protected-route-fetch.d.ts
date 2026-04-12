export declare const fetchProtectedAdminRoute: (
  input: string | URL,
  init?: RequestInit,
  options?: {
    retryOn401Once?: boolean;
    refreshPath?: string;
  }
) => Promise<Response>;
