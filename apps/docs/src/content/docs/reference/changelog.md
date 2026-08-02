---
title: Changelog
description: Release history for Overload — not yet started.
---

:::caution[This page is a draft]
**No versioned release has been published yet.** The API is at `0.0.1` and has never been tagged or deployed, so there is nothing to record here.

This page exists so the structure is in place — fill it in from the first release onward, rather than trying to reconstruct history later.
:::

## What belongs here

One entry per released version, newest first. Each entry should state the version, its release date, and changes grouped under **Added**, **Changed**, **Fixed**, **Deprecated** and **Removed** — following [Keep a Changelog](https://keepachangelog.com/).

Write for the person integrating against the API, not for the person who wrote the commit. "Added `POST /users/me` for updating your profile" is useful. "Refactored user service" is not.

## What to do before the first release

- Decide a versioning scheme. [Semantic versioning](https://semver.org/) is the default expectation for an API.
- Decide what counts as breaking. Removing a field, renaming one, or changing a status code all break clients — even when no endpoint disappears.
- Tag releases in Git so entries here map to something checkable.

## Template

```markdown
## [0.1.0] — 2026-XX-XX

### Added
- `PATCH /users/me` — update your own profile.

### Changed
- Validation errors now return a single unified shape.

### Fixed
- Archived exercises no longer appear in the default catalog listing.
```

## Unreleased

Everything currently in `main` is unreleased. The modules that exist today — authentication, users, exercises, routines, workouts, sets and analytics — will form the first entry once a version is cut.

See [Deployment](/guides/deployment/) for what still blocks a first release.
