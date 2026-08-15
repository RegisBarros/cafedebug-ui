import type { DebuggerGroup } from "./types";

export function debuggerCollectionJsonLd(groups: readonly DebuggerGroup[], siteUrl: string) {
  const members = groups.flatMap((group) => group.members);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Debuggers do CaféDebug",
    description: "Conheça as pessoas que apresentam, produzem e mantêm a comunidade do CaféDebug ativa.",
    url: `${siteUrl}/debuggers`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: members.map((member, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Person",
          name: member.name,
          jobTitle: member.roles.join(" · ")
        }
      }))
    }
  };
}
