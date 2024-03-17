/**
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

class Build {
  constructor (name, url) {
    this.name = name;
    this.url = url;
  }
}

class Release {
  constructor (releaseMeta) {
    this.version = releaseMeta.tag_name.replace('v', '');
    this.builds = releaseMeta.assets.map(asset => new Build(asset.name, asset.browser_download_url));
  }

  getBuild (platform, arch) {
    const requiredName = `tofu_${this.version}_${platform}_${arch}.zip`;
    return this.builds.find(build => build.name === requiredName);
  }
}

/**
 * Fetches the top 30 releases sorted in desc order.
 *
 * @return {Array<Release>} Releases.
 */
async function fetchReleases (githubToken) {
  const url = 'https://api.github.com/repos/opentofu/opentofu/releases';

  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const resp = await fetch(url, {
    headers
  });

  if (!resp.ok) {
    throw new Error('failed fetching releases (' + resp.status + ')');
  }

  const releasesMeta = await resp.json();

  return releasesMeta.map(releaseMeta => new Release(releaseMeta));
}

const semver = require('semver');

async function findLatestVersion (versions) {
  return versions.filter((v) => semver.prerelease(v) === null).sort((a, b) => semver.rcompare(a, b))[0];
}

async function findLatestVersionInRange (versions, range) {
  return semver.maxSatisfying(versions, range, { prerelease: true, loose: true });
}

/**
 * Fetches the release given the version.
 *
 * @param {string} version: Release version.
 * @param {string} githubToken: GitHub token to use for working around rate limits.
 * @param {function} fetchReleasesFn: Optional function to fetch releases.
 * @return {Release} Release.
 */
async function getRelease (version, githubToken, fetchReleasesFn = fetchReleases) {
  const latestVersionLabel = 'latest';

  const versionsRange = semver.validRange(version, { prerelease: true, loose: true });
  if (versionsRange === null && version !== latestVersionLabel) {
    throw new Error('Input version cannot be used, see semver: https://semver.org/spec/v2.0.0.html');
  }

  const releases = await fetchReleasesFn(githubToken);

  if (releases === null || releases.length === 0) {
    throw new Error('No tofu releases found, please contact OpenTofu');
  }

  const versionsFound = releases.map(release => release.version);
  let versionSelected;
  if (version === latestVersionLabel) {
    versionSelected = await findLatestVersion(versionsFound);
  } else {
    versionSelected = await findLatestVersionInRange(versionsFound, versionsRange);
  }

  if (versionSelected === null) {
    throw new Error('No matching version found');
  }

  return releases.find(release => release.version === versionSelected);
}

// Note that the export is defined as adaptor to replace hashicorp/js-releases
// See: https://github.com/hashicorp/setup-terraform/blob/e192cfcbae6c6ed207c277ed7624131996c9bf13/lib/setup-terraform.js#L15
module.exports = {
  getRelease,
  Release
};
