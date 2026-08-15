import { DebuggersRoute, getDebuggersMetadata } from "@/features/debuggers/server/debuggers-route";

export const metadata = getDebuggersMetadata();

export default function DebuggersPageRoute() {
  return <DebuggersRoute />;
}
