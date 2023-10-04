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
 */
async function fetchReleases () {
  const url = 'https://api.github.com/repos/opentofu/opentofu/releases';

  const resp = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!resp.ok) {
    throw Error('failed fetching releases');
  }

  const releasesMeta = await resp.json();

  return releasesMeta.map(releaseMeta => new Release(releaseMeta));
}

/**
 * Fetches the release given the version.
 *
 * @param {string} version: Release version.
 */
async function getRelease (version) {
  const releases = await fetchReleases();
  return releases.find(release => release.version === version);
}

// Note that the export is defined as adaptor to replace hashicorp/js-releases
// See: https://github.com/hashicorp/setup-terraform/blob/e192cfcbae6c6ed207c277ed7624131996c9bf13/lib/setup-terraform.js#L15
module.exports = {
  getRelease
};
