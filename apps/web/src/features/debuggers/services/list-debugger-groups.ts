import { mockDebuggerGroups } from "../mock/debuggers.mock";
import type { DebuggerGroup } from "../types";

export type DebuggerDirectory = {
  listGroups(): Promise<readonly DebuggerGroup[]>;
};

export function createMockDebuggerDirectory(groups: readonly DebuggerGroup[] = mockDebuggerGroups): DebuggerDirectory {
  return {
    async listGroups() {
      return groups;
    }
  };
}

const mockDebuggerDirectory = createMockDebuggerDirectory();

export async function listDebuggerGroups(): Promise<readonly DebuggerGroup[]> {
  return mockDebuggerDirectory.listGroups();
}
