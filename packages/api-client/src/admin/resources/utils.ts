import type { PathBasedClient } from "../../client";

type HttpVerb = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const m = <P extends keyof PathBasedClient, V extends HttpVerb & keyof PathBasedClient[P]>(
  client: PathBasedClient,
  path: P,
  verb: V
): PathBasedClient[P][V] => {
  const resource = client[path];
  return (resource[verb] as Function).bind(resource) as PathBasedClient[P][V];
};
