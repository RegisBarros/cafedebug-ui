import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_SHELL_NAV_ITEMS,
  DISABLED_NAV_ENTRY_LABEL,
  getAdminShellRouteContext,
  isAdminShellNavItemActive,
  resolveAdminShellNavInteraction,
  resolveAdminShellRouteContext
} from "../src/features/admin-shell/admin-shell-nav-items.js";

test("admin shell nav keeps dashboard/settings disabled while preserving routes", () => {
  const navByLabel = Object.fromEntries(
    ADMIN_SHELL_NAV_ITEMS.map((item) => [item.label, item])
  );

  assert.equal(navByLabel.Episodes.disabled, false);
  assert.equal(navByLabel.Dashboard.disabled, true);
  assert.equal(navByLabel.Settings.disabled, true);
  assert.equal(navByLabel.Dashboard.href, "/dashboard");
  assert.equal(navByLabel.Settings.href, "/settings");
  assert.equal(DISABLED_NAV_ENTRY_LABEL, "Disabled in V1 navigation");
});

test("active navigation matches exact and nested route prefixes", () => {
  const episodesNav = ADMIN_SHELL_NAV_ITEMS.find((item) => item.href === "/episodes");
  assert.ok(episodesNav, "episodes nav item should exist");

  assert.equal(isAdminShellNavItemActive(episodesNav, "/episodes"), true);
  assert.equal(isAdminShellNavItemActive(episodesNav, "/episodes/new"), true);
  assert.equal(isAdminShellNavItemActive(episodesNav, "/settings"), false);
});

test("route context exposes disabled in V1 status for dashboard and settings", () => {
  const dashboardContext = resolveAdminShellRouteContext("/dashboard");
  const settingsContext = resolveAdminShellRouteContext("/settings/profile");
  const episodesContext = resolveAdminShellRouteContext("/episodes/new");

  assert.equal(dashboardContext.disabledInV1, true);
  assert.equal(settingsContext.disabledInV1, true);
  assert.equal(episodesContext.disabledInV1, undefined);
  assert.equal(episodesContext.title, "Episodes");
});

test("typed route context always resolves disabledInV1 as boolean", () => {
  const episodesContext = getAdminShellRouteContext("/episodes");
  const dashboardContext = getAdminShellRouteContext("/dashboard");

  assert.equal(episodesContext.disabledInV1, false);
  assert.equal(dashboardContext.disabledInV1, true);
});

test("disabled navigation interaction exposes aria-disabled semantics", () => {
  const dashboardNavItem = ADMIN_SHELL_NAV_ITEMS.find(
    (item) => item.href === "/dashboard"
  );
  const episodesNavItem = ADMIN_SHELL_NAV_ITEMS.find(
    (item) => item.href === "/episodes"
  );

  assert.ok(dashboardNavItem, "dashboard nav item should exist");
  assert.ok(episodesNavItem, "episodes nav item should exist");

  assert.deepEqual(resolveAdminShellNavInteraction(dashboardNavItem), {
    ariaDisabled: true,
    interactive: false,
    tabIndex: -1
  });
  assert.deepEqual(resolveAdminShellNavInteraction(episodesNavItem), {
    ariaDisabled: undefined,
    interactive: true,
    tabIndex: undefined
  });
});
