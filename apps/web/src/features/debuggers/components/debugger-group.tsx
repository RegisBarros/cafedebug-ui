import { DebuggerCard } from "./debugger-card";
import type { DebuggerGroup as DebuggerGroupModel } from "../types";

function formatMemberCount(memberCount: number): string {
  return `${String(memberCount).padStart(2, "0")} pessoas`;
}

export function DebuggerGroup({ group }: { group: DebuggerGroupModel }) {
  const headingId = `debugger-group-${group.id}`;

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-secondary text-[26px] font-bold leading-[1.2]" id={headingId}>
            {group.title}
          </h2>
          <p className="font-secondary text-sm leading-[1.4] text-muted-foreground">{group.description}</p>
        </div>
        <p className="shrink-0 font-primary text-[13px] leading-[1.4] text-muted-foreground">{formatMemberCount(group.members.length)}</p>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {group.members.map((member) => <DebuggerCard key={member.id} member={member} />)}
      </div>
    </section>
  );
}
