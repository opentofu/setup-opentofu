// Node.js core
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

// External
const core = require('@actions/core');

// First party
const releases = require('../releases');
const setup = require('../setup-tofu');

// Mock dependencies
jest.mock('@actions/core');
jest.mock('@actions/io', () => ({
  mv: jest.fn(),
  cp: jest.fn(),
  mkdirP: jest.fn()
}));
jest.mock('@actions/tool-cache', () => ({
  downloadTool: jest.fn(),
  extractZip: jest.fn()
}));

// Mock releases.js so setup-tofu.js can be tested in isolation
jest.mock('../releases');

// Set up global test fixtures
const fallbackVersion = 'latest';
let tempDir;
let tempDirPath;
let version = '1.10.5';
let versionFile;
let versionFileName = '.opentofu-version';

describe('setup-tofu', () => {
  beforeAll(async () => {
    // Mock dependencies
    const tc = require('@actions/tool-cache');
    tc.downloadTool.mockResolvedValue('/mock/download/path');
    tc.extractZip.mockResolvedValue('/mock/extract/path');

    const io = require('@actions/io');
    io.mv.mockResolvedValue();
    io.cp.mockResolvedValue();
    io.mkdirP.mockResolvedValue();

    const mockRelease = {
      getBuild: jest.fn().mockReturnValue({ url: 'mock-url' })
    };
    releases.getRelease.mockResolvedValue(mockRelease);

    // Write version file to temporary directory
    tempDirPath = path.join(os.tmpdir(), 'setup-tofu-');
    tempDir = await fs.mkdtemp(tempDirPath);
    versionFile = path.join(tempDir, versionFileName);
    await fs.writeFile(versionFile, `${version}\n`);

    // Mock action inputs to return default values
    core.getInput.mockImplementation((name) => {
      const defaults = {
        tofu_version: fallbackVersion,
        tofu_version_file: versionFile,
        cli_config_credentials_hostname: '',
        cli_config_credentials_token: '',
        tofu_wrapper: 'true',
        github_token: ''
      };
      return defaults[name] || '';
    });

    // Mock environment variables
    process.env.GITHUB_TOKEN = 'mock-github-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    delete process.env.GITHUB_TOKEN;
  });

  describe('tofu_version_file functionality', () => {
    it('should read version from file when tofu_version_file is provided', async () => {
      jest.spyOn(fs, 'readFile');

      await setup();

      expect(releases.getRelease).toHaveBeenCalledWith(
        version, process.env.GITHUB_TOKEN
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should handle empty version file gracefully', async () => {
      jest.spyOn(fs, 'readFile');

      version = ' ';
      versionFileName = '.opentofu-version-empty';
      versionFile = path.join(tempDir, versionFileName);
      await fs.writeFile(versionFile, `${version}\n`);

      core.getInput.mockImplementation((name) => {
        if (name === 'tofu_version_file') {
          return versionFile;
        }
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(releases.getRelease).toHaveBeenCalledWith(
        fallbackVersion, process.env.GITHUB_TOKEN
      );

      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining(`Version file ${versionFile} is empty`)
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      jest.spyOn(fs, 'readFile');

      versionFileName = '.opentofu-version-file-does-not-exist';
      versionFile = path.join(tempDir, versionFileName);

      core.getInput.mockImplementation((name) => {
        if (name === 'tofu_version_file') {
          return versionFile;
        }
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(releases.getRelease).toHaveBeenCalledWith(
        fallbackVersion, process.env.GITHUB_TOKEN
      );

      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to read version from file ${versionFile}`)
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should not read file when tofu_version_file is not provided', async () => {
      jest.spyOn(fs, 'readFile');

      core.getInput.mockImplementation((name) => {
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(releases.getRelease).toHaveBeenCalledWith(
        fallbackVersion, process.env.GITHUB_TOKEN
      );

      expect(fs.readFile).not.toHaveBeenCalled();
    });
  });
});
