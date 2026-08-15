import { DebuggerGroup } from "./debugger-group";
import type { DebuggerGroup as DebuggerGroupModel } from "../types";

export function DebuggersPage({ groups }: { groups: readonly DebuggerGroupModel[] }) {
  return (
    <main className="flex min-w-0 flex-col gap-[72px] bg-background px-4 pb-24 pt-[72px] text-foreground sm:px-6 md:px-10 md:pb-24">
      <div className="mx-auto flex w-full min-w-0 max-w-[1360px] flex-col gap-[72px]">
        <section aria-labelledby="debuggers-page-title" className="flex max-w-[820px] flex-col gap-4">
          <p className="font-primary text-[13px] font-semibold leading-[1.4] tracking-[2px] text-primary">COMUNIDADE</p>
          <h1 className="font-secondary text-4xl font-bold leading-[1.1] sm:text-5xl md:text-[46px]" id="debuggers-page-title">
            As pessoas por trás do CaféDebug
          </h1>
          <p className="max-w-[640px] font-secondary text-[17px] leading-[1.6] text-muted-foreground">
            Somos um time apaixonado por tecnologia, carreira e pela comunidade dev brasileira. Conheça quem produz cada episódio e mantém a conversa viva.
          </p>
        </section>

        {groups.map((group) => <DebuggerGroup group={group} key={group.id} />)}
      </div>
    </main>
  );
}
