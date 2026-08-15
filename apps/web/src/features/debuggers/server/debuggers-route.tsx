import type { Metadata } from "next";

import { env } from "@/lib/env";

import { DebuggersPage } from "../components/debuggers-page";
import { listDebuggerGroups } from "../services/list-debugger-groups";
import { debuggerCollectionJsonLd } from "../structured-data";

export function getDebuggersMetadata(): Metadata {
  const title = "Debuggers";
  const description = "Conheça as pessoas que apresentam, produzem e mantêm a comunidade do CaféDebug ativa.";

  return {
    title,
    description,
    alternates: { canonical: "/debuggers" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${title} do CaféDebug`,
      description,
      url: "/debuggers"
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} do CaféDebug`,
      description
    }
  };
}

export async function DebuggersRoute() {
  const groups = await listDebuggerGroups();
  const jsonLd = debuggerCollectionJsonLd(groups, env.NEXT_PUBLIC_SITE_URL);

  return (
    <>
      <DebuggersPage groups={groups} />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
    </>
  );
}
