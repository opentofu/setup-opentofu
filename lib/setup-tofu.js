/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

// Node.js core
import { promises as fs } from 'fs';
import { platform, arch } from 'os';
import { sep, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// External
import {
  debug,
  error as logError,
  exportVariable,
  getInput,
  warning,
  addPath
} from '@actions/core';
import { downloadTool, extractZip, find, cacheDir } from '@actions/tool-cache';
import { mv, cp, mkdirP } from '@actions/io';
import { getRelease } from './releases.js';

// __dirname is not available in ES modules, so we need to construct it ourselves
const __dirname = dirname(fileURLToPath(import.meta.url));

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch (arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS (os) {
  if (os === 'win32') {
    return 'windows';
  }
  return os;
}

async function downloadAndExtractCLI (url) {
  debug(`Downloading OpenTofu CLI from ${url}`);
  const pathToCLIZip = await downloadTool(url);

  if (!pathToCLIZip) {
    throw new Error(`Unable to download OpenTofu from ${url}`);
  }

  let pathToCLI;

  debug('Extracting OpenTofu CLI zip file');
  if (platform().startsWith('win')) {
    debug(`OpenTofu CLI Download Path is ${pathToCLIZip}`);
    const fixedPathToCLIZip = `${pathToCLIZip}.zip`;
    await mv(pathToCLIZip, fixedPathToCLIZip);
    debug(`Moved download to ${fixedPathToCLIZip}`);
    pathToCLI = await extractZip(fixedPathToCLIZip);
  } else {
    pathToCLI = await extractZip(pathToCLIZip);
  }

  debug(`OpenTofu CLI path is ${pathToCLI}.`);

  if (!pathToCLI) {
    throw new Error('Unable to unzip OpenTofu');
  }

  return pathToCLI;
}

async function installWrapper (pathToCLI) {
  let source, target;

  // If we're on Windows, then the executable ends with .exe
  const exeSuffix = platform().startsWith('win') ? '.exe' : '';

  // Rename tofu(.exe) to tofu-bin(.exe)
  try {
    source = [pathToCLI, `tofu${exeSuffix}`].join(sep);
    target = [pathToCLI, `tofu-bin${exeSuffix}`].join(sep);
    debug(`Moving ${source} to ${target}.`);
    await mv(source, target);
  } catch (e) {
    logError(`Unable to move ${source} to ${target}.`);
    throw e;
  }

  // Install our wrapper as tofu
  try {
    source = resolve(
      [__dirname, '..', 'wrapper', 'dist', 'index.js'].join(sep)
    );
    target = [pathToCLI, 'tofu'].join(sep);
    debug(`Copying ${source} to ${target}.`);
    await cp(source, target);
  } catch (e) {
    logError(`Unable to copy ${source} to ${target}.`);
    throw e;
  }

  // Export a new environment variable, so our wrapper can locate the binary
  exportVariable('TOFU_CLI_PATH', pathToCLI);
}

// Add credentials to CLI Configuration File
// https://www.tofu.io/docs/commands/cli-config.html
async function addCredentials (credentialsHostname, credentialsToken, osPlat) {
  // format HCL block
  // eslint-disable
  const creds = `
credentials "${credentialsHostname}" {
  token = "${credentialsToken}"
}`.trim();
  // eslint-enable

  // default to OS-specific path
  let credsFile =
    osPlat === 'win32'
      ? `${process.env.APPDATA}/tofu.rc`
      : `${process.env.HOME}/.tofurc`;

  // override with TF_CLI_CONFIG_FILE environment variable
  credsFile = process.env.TF_CLI_CONFIG_FILE
    ? process.env.TF_CLI_CONFIG_FILE
    : credsFile;

  // get containing folder
  const credsFolder = dirname(credsFile);

  debug(`Creating ${credsFolder}`);
  await mkdirP(credsFolder);

  debug(`Adding credentials to ${credsFile}`);
  await fs.writeFile(credsFile, creds);
}

async function run () {
  try {
    // Gather GitHub Actions inputs
    let version = getInput('tofu_version');
    const versionFile = getInput('tofu_version_file');
    const credentialsHostname = getInput('cli_config_credentials_hostname');
    const credentialsToken = getInput('cli_config_credentials_token');
    const wrapper = getInput('tofu_wrapper') === 'true';
    const useCache = getInput('cache') === 'true';
    let githubToken = getInput('github_token');
    if (
      githubToken === '' &&
      !(process.env.FORGEJO_ACTIONS || process.env.GITEA_ACTIONS)
    ) {
      // Only default to the environment variable when running in GitHub Actions. Don't do this for other CI systems
      // that may set the GITHUB_TOKEN environment variable.
      githubToken = process.env.GITHUB_TOKEN;
    }

    // If tofu_version_file is provided, read the version from the file
    if (versionFile) {
      try {
        debug(`Reading OpenTofu version from file: ${versionFile}`);
        const fileVersion = await fs.readFile(versionFile, 'utf8');
        const trimmedVersion = fileVersion.trim();
        if (trimmedVersion) {
          version = trimmedVersion;
          debug(`Using version from file: ${version}`);
        } else {
          warning(
            `Version file ${versionFile} is empty, using tofu_version input: ${version}`
          );
        }
      } catch (error) {
        warning(
          `Failed to read version from file ${versionFile}: ${error.message}. Using tofu_version input: ${version}`
        );
      }
    }

    // Gather OS details
    const osPlatform = platform();
    const osArch = arch();

    debug(`Finding releases for OpenTofu version ${version}`);
    const release = await getRelease(version, githubToken);
    const buildPlatform = mapOS(osPlatform);
    const buildArch = mapArch(osArch);
    const build = release.getBuild(buildPlatform, buildArch);
    if (!build) {
      throw new Error(
        `OpenTofu version ${version} not available for ${buildPlatform} and ${buildArch}`
      );
    }

    // Download requested version if not cached
    let pathToCLI;
    if (useCache) {
      const cachedPath = find('tofu', release.version, buildArch);
      if (cachedPath) {
        debug(`Using cached OpenTofu version ${release.version} from ${cachedPath}`);
        pathToCLI = cachedPath;
      } else {
        debug(`OpenTofu version ${release.version} not found in cache, downloading...`);
        const extractedPath = await downloadAndExtractCLI(build.url);
        debug(`Caching OpenTofu version ${release.version} to tool cache`);
        pathToCLI = await cacheDir(extractedPath, 'tofu', release.version, buildArch);
      }
    } else {
      pathToCLI = await downloadAndExtractCLI(build.url);
    }

    // Install our wrapper
    if (wrapper) {
      await installWrapper(pathToCLI);
    }

    // Add to path
    addPath(pathToCLI);

    // Add credentials to file if they are provided
    if (credentialsHostname && credentialsToken) {
      await addCredentials(credentialsHostname, credentialsToken, osPlatform);
    }
    return release;
  } catch (error) {
    logError(error);
    throw error;
  }
}

export default run;
