import assert from "node:assert/strict";
import test from "node:test";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";

const readText = async (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  return readFile(fileUrl, "utf8");
};

test("login route delegates to feature server handler", async () => {
  const routeFile = await readText("../src/app/api/auth/login/route.ts");

  assert.match(
    routeFile,
    /import\s+\{\s*loginHandler\s*\}\s+from\s+"@\/features\/auth\/server\/login\.handler";/
  );
  assert.match(routeFile, /return\s+loginHandler\(request\);/);
  assert.doesNotMatch(routeFile, /createAdminApiClient/);
  assert.doesNotMatch(routeFile, /NextResponse\.json/);
});

test("login component remains presentation only without direct fetch", async () => {
  const loginFormFile = await readText(
    "../src/features/auth/components/login-form.tsx"
  );

  assert.doesNotMatch(loginFormFile, /\bfetch\s*\(/);
});

test("legacy non-layered login form implementation does not exist", async () => {
  const legacyLoginFormUrl = new URL(
    "../src/features/auth/login-form.tsx",
    import.meta.url
  );

  await assert.rejects(
    access(legacyLoginFormUrl, constants.F_OK),
    { code: "ENOENT" }
  );
});
