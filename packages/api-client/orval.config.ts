import { defineConfig } from "orval";

export default defineConfig({
  cafedebug: {
    input: {
      target: "../../.specs/admin/backend-openspec-api.json"
    },
    output: {
      mode: "tags-split",
      target: "./src/generated",
      schemas: "./src/generated/models",
      client: "fetch",
      baseUrl: "",
      override: {
        fetch: {
          includeHttpResponseReturnType: true
        },
        mutator: {
          path: "./src/core/fetcher.ts",
          name: "customFetch"
        }
      }
    }
  }
});
