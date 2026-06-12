/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { HttpClient, HttpCodes } from '@actions/http-client';
import semver from 'semver';
import { getErrorMessage } from './error-utils.js';

class Build {
  constructor (version, name) {
    this.name = name;
    this.url = `https://github.com/opentofu/opentofu/releases/download/v${version}/${name}`;
  }
}

class Release {
  constructor (releaseMeta) {
    this.version = releaseMeta.id.replace('v', '');
    this.builds = releaseMeta.files.map(
      (asset) => new Build(this.version, asset)
    );
  }

  getBuild (platform, arch) {
    const requiredName = `tofu_${this.version}_${platform}_${arch}.zip`;
    return this.builds.find((build) => build.name === requiredName);
  }
}

/**
 * Fetches the top 30 releases sorted in desc order.
 *
 * @return {Array<Release>} Releases.
 */
async function fetchReleases (githubToken) {
  const userAgent = 'opentofu/setup-opentofu';

  const http = new HttpClient(userAgent);

  const url = 'https://get.opentofu.org/tofu/api.json';

  const headers = {
    Accept: 'application/json'
  };

  let resp;
  try {
    resp = await http.get(url, headers);
  } catch (error) {
    const cause = getErrorMessage(error);
    throw new Error(`Failed to fetch OpenTofu releases from ${url}: ${cause}`);
  }

  if (resp.message.statusCode !== HttpCodes.OK) {
    throw new Error(
      'failed fetching releases (' + resp.message.statusCode + ')'
    );
  }

  let body;
  try {
    body = await resp.readBody();
  } catch (error) {
    const cause = getErrorMessage(error);
    throw new Error(`Failed to read releases response: ${cause}`);
  }

  let releasesMeta;
  try {
    releasesMeta = JSON.parse(body);
  } catch (error) {
    const cause = getErrorMessage(error);
    throw new Error(`Invalid releases JSON from ${url}: ${cause}`);
  }

  /**
   * @type {Array}
   */
  const versions = releasesMeta.versions;

  return versions.map((releaseMeta) => new Release(releaseMeta));
}

/**
 * Fetches the raw SHA256SUMS file published alongside an OpenTofu release.
 *
 * @param {string} version: Release version (without the leading `v`).
 * @return {string} Raw SHA256SUMS file body.
 */
async function fetchSHA256SUMS (version) {
  const userAgent = 'opentofu/setup-opentofu';

  const http = new HttpClient(userAgent);

  const url = `https://github.com/opentofu/opentofu/releases/download/v${version}/tofu_${version}_SHA256SUMS`;

  let resp;
  try {
    resp = await http.get(url);
  } catch (error) {
    const cause = getErrorMessage(error);
    throw new Error(`Failed to fetch SHA256SUMS from ${url}: ${cause}`);
  }

  if (resp.message.statusCode !== HttpCodes.OK) {
    throw new Error(
      'failed fetching SHA256SUMS (' + resp.message.statusCode + ')'
    );
  }

  return resp.readBody();
}

/**
 * Parses a SHA256SUMS file body and returns the checksum for a given file name.
 *
 * Each line follows the `sha256sum` format: a lowercase hex digest, whitespace,
 * then the file name (binary-mode lines prefix the name with `*`).
 *
 * @param {string} body: Raw SHA256SUMS file body.
 * @param {string} fileName: Asset file name to look up.
 * @return {string|null} Lowercase hex SHA-256 checksum, or null when not found.
 */
function parseChecksum (body, fileName) {
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') {
      continue;
    }

    const separatorIndex = trimmed.search(/\s/);
    if (separatorIndex === -1) {
      continue;
    }

    const checksum = trimmed.slice(0, separatorIndex);
    const name = trimmed.slice(separatorIndex).trim().replace(/^\*/, '');
    if (name === fileName) {
      return checksum.toLowerCase();
    }
  }

  return null;
}

/**
 * Resolves the published SHA-256 checksum for a release asset by fetching the
 * release's SHA256SUMS file and looking up the asset's file name.
 *
 * @param {string} version: Release version (without the leading `v`).
 * @param {string} fileName: Asset file name to look up.
 * @param {function} fetchSumsFn: Optional fetcher for the SHA256SUMS body (for testing).
 * @return {string|null} Lowercase hex SHA-256 checksum, or null when not found.
 */
async function getDownloadChecksum (
  version,
  fileName,
  fetchSumsFn = fetchSHA256SUMS
) {
  const body = await fetchSumsFn(version);
  return parseChecksum(body, fileName);
}

async function findLatestVersion (versions) {
  return versions
    .filter((v) => semver.prerelease(v) === null)
    .sort((a, b) => semver.rcompare(a, b))[0];
}

async function findLatestVersionInRange (versions, range) {
  return semver.maxSatisfying(versions, range, {
    prerelease: true,
    loose: true
  });
}

/**
 * Fetches the release given the version.
 *
 * @param {string} version: Release version.
 * @param {string} githubToken: GitHub token to use for working around rate limits.
 * @param {function} fetchReleasesFn: Optional function to fetch releases.
 * @return {Release} Release.
 */
async function getRelease (
  version,
  githubToken,
  fetchReleasesFn = fetchReleases
) {
  const latestVersionLabel = 'latest';

  const versionsRange = semver.validRange(version, {
    prerelease: true,
    loose: true
  });
  if (versionsRange === null && version !== latestVersionLabel) {
    throw new Error(
      'Input version cannot be used, see semver: https://semver.org/spec/v2.0.0.html'
    );
  }

  const releases = await fetchReleasesFn(githubToken);

  if (releases === null || releases.length === 0) {
    throw new Error('No tofu releases found, please contact OpenTofu');
  }

  const versionsFound = releases.map((release) => release.version);
  let versionSelected;
  if (version === latestVersionLabel) {
    versionSelected = await findLatestVersion(versionsFound);
  } else {
    versionSelected = await findLatestVersionInRange(
      versionsFound,
      versionsRange
    );
  }

  if (versionSelected === null) {
    throw new Error('No matching version found');
  }

  return releases.find((release) => release.version === versionSelected);
}

export { getRelease, getDownloadChecksum, parseChecksum, Release };
