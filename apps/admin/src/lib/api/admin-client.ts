import { createAdminApiClient, type AdminApiClient } from "@cafedebug/api-client";

import { adminRuntimeEnv } from "@/lib/env";

let _client: AdminApiClient | null = null;

export const getAdminApiClient = (): AdminApiClient | null => {
  if (!adminRuntimeEnv.apiBaseUrl) return null;

  if (!_client) {
    _client = createAdminApiClient({ baseUrl: adminRuntimeEnv.apiBaseUrl });
  }

  return _client;
};
