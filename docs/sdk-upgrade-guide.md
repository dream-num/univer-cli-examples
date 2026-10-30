# Upgrading the Univer SDK

> **Internal workflow notice.** This document describes the internal upgrade
> workflow of the `univer-cli-examples` repository. It is **not** an external
> example or tutorial: it assumes maintainer access to the upstream insider
> npm registry and to this repository's CI settings, and it is not meant to
> teach general Univer usage. For usage examples, see the directories under
> `examples/`.

Every example pins exact `@univer-cli` / `@univerjs` / `@univerjs-pro`
versions and keeps its own `pnpm-lock.yaml`. Shared configuration lives at
the repository root (`pnpm-workspace.yaml`, `.npmrc`).

## Workflow

### 1. Create the upgrade branch

```sh
git fetch origin && git checkout main && git merge --ff-only origin/main
git checkout -b codex/upgrade-examples-sdk-<version>   # e.g. ...-sdk-1.3.1
```

### 2. Bump the SDK pins

- Move every `@univer-cli` / `@univerjs` / `@univerjs-pro` dependency in all
  `examples/*/package.json` to the exact new version, and update the version
  mention in each example's README (English and Chinese).
- Add any new Univer package names to `minimumReleaseAgeExclude` in
  `pnpm-workspace.yaml`. Full package names only — a scope wildcard would
  also exempt future or attacker-published packages under the scope. The
  regenerated lockfile surfaces any names you missed.

### 3. If the release is not on the public registry yet

Commit a root `.npmrc` pointing the Univer scopes at the insider registry
(inherited by every example; per-example `.npmrc` files must not exist):

```
@univer-cli:registry=https://insider-npm-registry.univer.work/
@univerjs:registry=https://insider-npm-registry.univer.work/
@univerjs-pro:registry=https://insider-npm-registry.univer.work/
```

Then regenerate each lockfile and verify:

```sh
pnpm --dir examples/<example> install --no-frozen-lockfile
pnpm --dir examples/<example> install --frozen-lockfile   # the CI scenario must pass
pnpm --dir examples/<example> check
```

While the insider `.npmrc` is committed, the `merge-gate` CI check stays red
on purpose: **the branch must not be merged while a private registry is
configured.**

Known pnpm behavior (no setting can change it): the insider registry's
metadata reports `registry.npmjs.org` tarball URLs, so the lockfile records
absolute `tarball:` fields for Univer packages. Do **not** hand-edit them;
they are canonical public URLs and stay valid after promotion.

### 4. After upstream promotes the release to the public registry

1. Confirm every Univer package referenced by the lockfiles is on the public
   registry with an integrity hash identical to the lockfile
   (`npm view <pkg>@<version> dist.integrity`).
2. Delete the `.npmrc` and reinstall from the public registry:

   ```sh
   git rm .npmrc
   pnpm --dir examples/<example> install --frozen-lockfile
   ```

3. Verify the lockfile did not drift: the package set and every integrity
   hash must be identical to the pre-promotion lockfile, because the
   promoted tarballs are bit-identical.
4. Commit and push; all CI checks must be green.

### 5. Merge

All CI checks must be green (the four `Check` jobs and `merge-gate`), then
squash-merge the pull request into `main` and delete the branch. To turn the
`merge-gate` check into a hard block, a repository admin must add it to the
branch protection required status checks.
