# Upgrading the Univer SDK

> **Internal workflow notice.** This document describes the internal upgrade
> workflow of the `univer-cli-examples` repository. It is **not** an external
> example or tutorial: it assumes maintainer access to the upstream insider
> npm registry and to this repository's CI settings, and it is not meant to
> teach general Univer usage. For usage examples, see the directories under
> `examples/`.

Every example pins exact `@univer-cli` / `@univerjs` / `@univerjs-pro`
versions and keeps its own `pnpm-lock.yaml`. Shared configuration lives at
the repository root (`pnpm-workspace.yaml`, `.npmrc`). The branch policy in
[README.md](../README.md#branch-policy) applies: `main` depends only on the
publicly released SDK, and changes that need an unreleased SDK wait on the
`<version>-next` branch named after the currently published version.

## Which path

- **The new SDK version is already public**: upgrade on a short-lived branch
  from `main` and open the pull request against `main`. Steps 1, 2, 4 and 5;
  skip step 3. If a `-next` branch is waiting for exactly this version, the
  upgrade is the completion of that branch instead: do steps 4 and 5 there.
- **Something needs an SDK version that is not public yet**: work on the
  `-next` branch (steps 1 to 3), creating it from `main` if it does not exist.
  When upstream publishes the release, finish with steps 4 and 5 on that
  branch.

Exception: upstream publishes an intermediate version, such as a patch cut
from a release branch, that the `-next` branch does not wait for. Then `main`
is upgraded through its own pull request as above, and afterwards the `-next`
branch merges `main` and is renamed after the new published version (`git
branch -m 1.3.1-next 1.3.2-next`, then push), keeping its `.npmrc`.

## Workflow

### 1. Create the branch

```sh
git fetch origin && git checkout main && git merge --ff-only origin/main
git checkout -b <version>-next   # the published SDK version it follows, e.g. 1.3.1-next
```

If the `-next` branch already exists, start a feature branch from it and open
the pull request against it instead; the feature branch inherits the `.npmrc`.
For an upgrade to an already public version use any short-lived branch name.

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

Pull requests into the `-next` branch run the `Check` jobs only, so their CI
result is meaningful. The `merge-gate` check runs on pull requests into `main`
and rejects the committed `.npmrc` and any pre-release version: **the `-next`
branch cannot be merged into `main` until step 4 is done.**

Known pnpm behavior (no setting can change it): the insider registry's
metadata reports `registry.npmjs.org` tarball URLs, so the lockfile records
absolute `tarball:` fields for Univer packages. Do **not** hand-edit them;
they are canonical public URLs and stay valid after promotion.

### 4. After upstream promotes the release to the public registry

1. Confirm every Univer package referenced by the lockfiles is on the public
   registry with an integrity hash identical to the lockfile
   (`npm view <pkg>@<version> dist.integrity`).
2. If step 2 pinned insiders builds (`-insiders.` versions) rather than the
   final version number, move the pins to the released version first. Then
   delete the `.npmrc` and reinstall from the public registry:

   ```sh
   git rm .npmrc
   pnpm --dir examples/<example> install --frozen-lockfile   # --no-frozen-lockfile if pins moved
   ```

3. Verify the lockfile. When the pins did not change, the package set and
   every integrity hash must be identical to the pre-promotion lockfile,
   because the promoted tarballs are bit-identical. When the pins moved from
   insiders builds to the release, review the lockfile diff as for any
   upgrade.
4. Commit and push; all CI checks must be green.

### 5. Merge

Open the pull request against `main`. All CI checks must be green (the four
`Check` jobs and `merge-gate`), then squash-merge it and delete the branch.
The next `-next` branch is created only when the first change that needs an
unreleased SDK is ready. To turn the `merge-gate` check into a hard block, a
repository admin must add it to the branch protection required status checks.
