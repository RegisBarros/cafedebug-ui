import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { mockDebuggerGroups } from "../src/features/debuggers/mock/debuggers.mock.ts";
import { createMockDebuggerDirectory } from "../src/features/debuggers/services/list-debugger-groups.ts";
import { debuggerCollectionJsonLd } from "../src/features/debuggers/structured-data.ts";
import { debuggerSocialPlatforms, getDebuggerSocialLinks } from "../src/features/debuggers/types.ts";

const root = process.cwd();
const readSource = (file) => readFileSync(join(root, file), "utf8");

test("debugger fixtures preserve Pencil group and member order with local assets", () => {
  assert.deepEqual(mockDebuggerGroups.map((group) => group.title), ["Apresentadores", "Contribuidores", "Comunidade"]);
  assert.deepEqual(mockDebuggerGroups.map((group) => group.members.length), [3, 6, 3]);
  assert.deepEqual(mockDebuggerGroups.flatMap((group) => group.members.map((member) => member.name)), [
    "Ana Ribeiro",
    "Bruno Carvalho",
    "Marina Costa",
    "Diego Almeida",
    "Letícia Souza",
    "Rafael Lima",
    "Camila Nunes",
    "Pedro Henrique",
    "Juliana Reis",
    "Thiago Martins",
    "Fernanda Dias",
    "Lucas Pereira"
  ]);
  assert.ok(mockDebuggerGroups.flatMap((group) => group.members).every((member) => member.avatar.src.startsWith("/mock/")));
  assert.ok(mockDebuggerGroups.flatMap((group) => group.members).every((member) => member.avatar.alt === member.name));
});

test("debugger directory is local and preserves deterministic fixture order", async () => {
  const directory = createMockDebuggerDirectory();

  assert.deepEqual(await directory.listGroups(), mockDebuggerGroups);
});

test("social-link derivation only returns declared destinations in the approved platform order", () => {
  const socialLinks = getDebuggerSocialLinks({
    id: "social-example",
    name: "Pessoa Exemplo",
    roles: ["Colaboradora"],
    biography: "Perfil somente para validar a presença condicional de links sociais.",
    avatar: { src: "/mock/hero-guest-ana.jpg", alt: "Pessoa Exemplo" },
    socialLinks: {
      github: "https://github.com/cafedebug",
      linkedin: "https://www.linkedin.com/company/cafedebug"
    }
  });

  assert.deepEqual(debuggerSocialPlatforms, ["github", "instagram", "linkedin", "x", "bluesky"]);
  assert.deepEqual(socialLinks, [
    { platform: "github", href: "https://github.com/cafedebug" },
    { platform: "linkedin", href: "https://www.linkedin.com/company/cafedebug" }
  ]);
});

test("debugger collection JSON-LD is canonical and lists every person once", () => {
  const jsonLd = debuggerCollectionJsonLd(mockDebuggerGroups, "https://cafedebug.com.br");

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(jsonLd["@type"], "CollectionPage");
  assert.equal(jsonLd.url, "https://cafedebug.com.br/debuggers");
  assert.equal(jsonLd.mainEntity.itemListElement.length, 12);
  assert.deepEqual(jsonLd.mainEntity.itemListElement.map((item) => item.position), Array.from({ length: 12 }, (_, index) => index + 1));
});

test("debugger route remains a thin feature boundary and the feature has no direct fetch", () => {
  const routeSource = readSource("src/app/(beta)/debuggers/page.tsx");
  const featureSources = [
    "src/features/debuggers/components/debugger-card.tsx",
    "src/features/debuggers/components/debugger-group.tsx",
    "src/features/debuggers/components/debuggers-page.tsx",
    "src/features/debuggers/mock/debuggers.mock.ts",
    "src/features/debuggers/services/list-debugger-groups.ts",
    "src/features/debuggers/server/debuggers-route.tsx",
    "src/features/debuggers/structured-data.ts",
    "src/features/debuggers/types.ts"
  ].map(readSource);

  assert.match(routeSource, /DebuggersRoute/);
  assert.match(routeSource, /getDebuggersMetadata/);
  assert.doesNotMatch(routeSource, /<Header|<Footer|fetch\(/);
  assert.ok(featureSources.every((source) => !source.includes("fetch(")));
});

test("debugger cards retain one accessible visual responsibility at the fixed desktop width", () => {
  const cardSource = readSource("src/features/debuggers/components/debugger-card.tsx");
  const groupSource = readSource("src/features/debuggers/components/debugger-group.tsx");
  const pageSource = readSource("src/features/debuggers/components/debuggers-page.tsx");

  assert.match(cardSource, /<article/);
  assert.match(cardSource, /size-\[92px\].*rounded-pill.*object-cover/);
  assert.match(cardSource, /rounded-m border border-border bg-card p-7/);
  assert.match(cardSource, /debuggerSocialPlatforms\.map/);
  assert.match(cardSource, /github.*instagram.*linkedin.*x.*bluesky/s);
  assert.match(cardSource, /aria-hidden=\{hasVerifiedSocialLink \? undefined : true\}/);
  assert.match(cardSource, /aria-label=/);
  assert.match(cardSource, /target="_blank"/);
  assert.match(cardSource, /rel="noreferrer"/);
  assert.match(cardSource, /size-10[\s\S]*size-\[34px\]/);
  assert.match(groupSource, /String\(memberCount\)\.padStart\(2, "0"\)/);
  assert.match(groupSource, /grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3/);
  assert.match(pageSource, /<main/);
  assert.match(pageSource, /<h1/);
  assert.match(pageSource, /mx-auto flex w-full min-w-0 max-w-\[1360px\]/);
  assert.doesNotMatch(pageSource, /<Header|<Footer|MiniPlayer/);
});

test("shared navigation exposes Debuggers everywhere without a stale Time entry", () => {
  const navigationSource = readSource("src/components/layout/navigation-items.ts");
  const footerSource = readSource("src/components/layout/footer.tsx");
  const sitemapSource = readSource("src/app/sitemap.ts");

  assert.match(navigationSource, /\{ label: "Debuggers", href: "\/debuggers" \}/);
  assert.match(footerSource, /\{ label: "Debuggers", href: "\/debuggers" \}/);
  assert.doesNotMatch(navigationSource, /label: "Time"/);
  assert.doesNotMatch(footerSource, /label: "Time"/);
  assert.match(sitemapSource, /\$\{env\.NEXT_PUBLIC_SITE_URL\}\/debuggers/);
});
