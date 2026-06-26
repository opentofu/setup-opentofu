## Releasing

Releases are made on a reasonably regular basis by the maintainers. The following notes are only relevant to maintainers.

Release process:

1. Create a PR against `main` with the following changes:
   - Update the version in `package.json`:
     ```shell
     npm version patch|minor|major --no-git-tag-version
     ```
   - Run the build to update the `dist/` directory:
     ```shell
     npm run build
     ```

2. Review and merge the PR.

3. [Create and publish a GitHub release](https://github.com/opentofu/setup-opentofu/releases/new) with tag `vX.Y.Z`, using the auto-generated release notes as the release body.

4. Update the rolling major version tag to point to the new release:
   ```shell
   git tag -f v2 vX.Y.Z
   git push --force origin v2
   ```
   This allows users to pin to `opentofu/setup-opentofu@v2` and always get the latest version of the rolling tag.
