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

const FETCH_RELEASES_MAX_ATTEMPTS = 4;
const FETCH_RELEASES_BASE_DELAY_MS = 500;
const FETCH_RELEASES_MAX_DELAY_MS = 8000;

// Status codes that are worth retrying. Transient per GitHub's guidance
// (https://docs.github.com/en/rest/overview/resources-in-the-rest-api#abuse-rate-limits)
// and general HTTP semantics for 5xx / 408 Request Timeout / 429 Too Many Requests.
const RETRYABLE_STATUS_CODES = new Set([
  HttpCodes.RequestTimeout,
  HttpCodes.TooManyRequests,
  HttpCodes.InternalServerError,
  HttpCodes.BadGateway,
  HttpCodes.ServiceUnavailable,
  HttpCodes.GatewayTimeout
]);

function _sleep (ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function _backoffDelayMs (attempt) {
  // Exponential backoff: 500ms, 1s, 2s, 4s, ... capped at 8s, with jitter up to 250ms
  // so multiple concurrent runners don't resync on the same retry boundary.
  const exponential = Math.min(
    FETCH_RELEASES_BASE_DELAY_MS * Math.pow(2, attempt),
    FETCH_RELEASES_MAX_DELAY_MS
  );
  const jitter = Math.floor(Math.random() * 250);
  return exponential + jitter;
}

/**
 * Fetches the top 30 releases sorted in desc order.
 *
 * Retries transient failures (network errors, 408/429/5xx responses) with
 * exponential backoff + jitter. Permanent failures (4xx other than 408/429,
 * malformed JSON) fail fast on the first attempt.
 *
 * @return {Array<Release>} Releases.
 */
async function fetchReleases (githubToken, {
  maxAttempts = FETCH_RELEASES_MAX_ATTEMPTS,
  sleepFn = _sleep,
  backoffFn = _backoffDelayMs
} = {}) {
  const userAgent = 'opentofu/setup-opentofu';

  const http = new HttpClient(userAgent);

  const url = 'https://get.opentofu.org/tofu/api.json';

  const headers = {
    Accept: 'application/json'
  };

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let resp;
    try {
      resp = await http.get(url, headers);
    } catch (error) {
      // Network-level failure -- always retryable; fall through to backoff.
      lastError = new Error(
        `Failed to fetch OpenTofu releases from ${url}: ${getErrorMessage(error)}`
      );
      if (attempt < maxAttempts - 1) {
        await sleepFn(backoffFn(attempt));
        continue;
      }
      throw lastError;
    }

    const status = resp.message.statusCode;
    if (status !== HttpCodes.OK) {
      lastError = new Error(
        'failed fetching releases (' + status + ')'
      );
      if (RETRYABLE_STATUS_CODES.has(status) && attempt < maxAttempts - 1) {
        await sleepFn(backoffFn(attempt));
        continue;
      }
      throw lastError;
    }

    let body;
    try {
      body = await resp.readBody();
    } catch (error) {
      // Response body stream failure -- treat as transient.
      lastError = new Error(
        `Failed to read releases response: ${getErrorMessage(error)}`
      );
      if (attempt < maxAttempts - 1) {
        await sleepFn(backoffFn(attempt));
        continue;
      }
      throw lastError;
    }

    let releasesMeta;
    try {
      releasesMeta = JSON.parse(body);
    } catch (error) {
      // Malformed JSON is a permanent failure -- retrying won't help.
      throw new Error(
        `Invalid releases JSON from ${url}: ${getErrorMessage(error)}`
      );
    }

    /**
     * @type {Array}
     */
    const versions = releasesMeta.versions;

    return versions.map((releaseMeta) => new Release(releaseMeta));
  }

  // Loop can only exit via throw or return; this is defensive.
  throw lastError || new Error('fetchReleases: exhausted retries with no outcome');
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

export { getRelease, Release, fetchReleases };
