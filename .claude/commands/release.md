Release a new version of skills-check.

## Arguments

- $ARGUMENTS: Version bump type — "patch", "minor", or "major". Defaults to "minor" if not specified.

## Steps

1. **Determine the new version.** Read the current version from `packages/cli/package.json`. Apply the requested semver bump ($ARGUMENTS, default "minor") to compute the new version number.

2. **Verify preconditions:**
   - Working tree is clean (`git status --porcelain` is empty)
   - On the `main` branch
   - Up to date with remote (`git pull --dry-run` shows no changes)
   - All tests pass (`npm test`)
   - Build succeeds (`npm run build`)

3. **Bump version in ALL package.json files** (must stay in lock step):
   - `package.json` (root)
   - `packages/cli/package.json`
   - `packages/schema/package.json`
   - `packages/web/package.json`

4. **Commit the version bump:**
   ```
   chore: bump version to X.Y.Z
   ```

5. **Create the version tag:** `vX.Y.Z`

6. **Push commit and tag:**
   ```
   git push origin main
   git push origin vX.Y.Z
   ```

7. **Update the floating major version tag** (e.g., `v1` for any `1.x.x` release):
   ```
   git tag -f vMAJOR
   git push origin vMAJOR --force
   ```
   This ensures users referencing `voodootikigod/skills-check@v1` in GitHub Actions get the latest release.

8. **Confirm completion.** Print a summary of:
   - Previous version → new version
   - Tag created
   - Floating tag updated
   - Remind that `publish.yml` will handle npm publish automatically from the new tag
