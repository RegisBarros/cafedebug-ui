# Specs Directory

This repository follows a specs-driven workflow for non-trivial work.

Specs help keep humans, Copilot, and other agents aligned before code starts moving.

## Where Specs Live

```text
.specs/
  web/         # Public website pages and flows
  admin/       # Admin backoffice screens and workflows
  platform/    # Monorepo, CI/CD, deployment, shared packages
```

## When a Spec Is Required

Create or update a spec when the work changes:

- user-facing behavior
- route structure
- CRUD workflows
- API assumptions
- layout or component composition
- SEO behavior
- analytics behavior
- authentication or authorization
- deployment architecture

Small copy edits or isolated bug fixes may not need a new spec, but they should still respect existing specs.

## Recommended Spec Template

Use this structure:

```md
# Title

## Summary

## Problem

## Goals

## Non-Goals

## Users and Use Cases

## Routes or Screens

## Data and API Contract

## Content and SEO

## Analytics

## Accessibility and Responsiveness

## Edge Cases

## Acceptance Criteria

## Test Plan

## Design References
```

## What Good Specs Include

- a clear user or business problem
- real endpoints or data dependencies
- SEO requirements when the change affects public pages
- analytics requirements when the change affects funnels or discovery
- accessibility and responsive expectations
- acceptance criteria that can be tested

## Suggested First Specs

- `.specs/web/homepage.md`
- `.specs/web/episode-detail.md`
- `.specs/admin/episodes-crud.md`
- `.specs/admin/banners-crud.md`
- `.specs/platform/deployment.md`
