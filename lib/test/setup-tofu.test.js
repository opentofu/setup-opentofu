/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { jest } from '@jest/globals';

// Node.js core
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Set up mocks BEFORE dynamic imports
jest.unstable_mockModule('@actions/core', () => ({
  getInput: jest.fn(),
  getMultilineInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  addPath: jest.fn(),
  exportVariable: jest.fn()
}));

jest.unstable_mockModule('@actions/io', () => ({
  mv: jest.fn(),
  cp: jest.fn(),
  mkdirP: jest.fn()
}));

jest.unstable_mockModule('@actions/tool-cache', () => ({
  downloadTool: jest.fn(),
  extractZip: jest.fn(),
  find: jest.fn(),
  cacheDir: jest.fn()
}));

jest.unstable_mockModule('../releases.js', () => ({
  getRelease: jest.fn(),
  Release: jest.fn()
}));

// Dynamic imports pick up the mocks
const { getInput, getMultilineInput, warning } = await import('@actions/core');
const tc = await import('@actions/tool-cache');
const io = await import('@actions/io');
const { getRelease } = await import('../releases.js');
const { default: setup } = await import('../setup-tofu.js');

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
    tc.downloadTool.mockResolvedValue('/mock/download/path');
    tc.extractZip.mockResolvedValue('/mock/extract/path');
    tc.find.mockReturnValue(null); // Default to cache miss
    tc.cacheDir.mockResolvedValue('/mock/cached/path');

    io.mv.mockResolvedValue();
    io.cp.mockResolvedValue();
    io.mkdirP.mockResolvedValue();

    const mockRelease = {
      version: '1.10.5',
      getBuild: jest.fn().mockReturnValue({ url: 'mock-url' })
    };
    getRelease.mockResolvedValue(mockRelease);

    // Write version file to temporary directory
    tempDirPath = join(tmpdir(), 'setup-tofu-');
    tempDir = await fs.mkdtemp(tempDirPath);
    versionFile = join(tempDir, versionFileName);
    await fs.writeFile(versionFile, `${version}\n`);

    // Mock action inputs to return default values
    getInput.mockImplementation((name) => {
      const defaults = {
        tofu_version: fallbackVersion,
        tofu_version_file: versionFile,
        cli_config_credentials_hostname: '',
        cli_config_credentials_token: '',
        tofu_wrapper: 'true',
        cache: 'false',
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

      expect(getRelease).toHaveBeenCalledWith(
        version,
        process.env.GITHUB_TOKEN
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should handle empty version file gracefully', async () => {
      jest.spyOn(fs, 'readFile');

      version = ' ';
      versionFileName = '.opentofu-version-empty';
      versionFile = join(tempDir, versionFileName);
      await fs.writeFile(versionFile, `${version}\n`);

      getInput.mockImplementation((name) => {
        if (name === 'tofu_version_file') {
          return versionFile;
        }
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(getRelease).toHaveBeenCalledWith(
        fallbackVersion,
        process.env.GITHUB_TOKEN
      );

      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining(`Version file ${versionFile} is empty`)
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      jest.spyOn(fs, 'readFile');

      versionFileName = '.opentofu-version-file-does-not-exist';
      versionFile = join(tempDir, versionFileName);

      getInput.mockImplementation((name) => {
        if (name === 'tofu_version_file') {
          return versionFile;
        }
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(getRelease).toHaveBeenCalledWith(
        fallbackVersion,
        process.env.GITHUB_TOKEN
      );

      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to read version from file ${versionFile}`
        )
      );

      expect(fs.readFile).toHaveBeenCalled();
    });

    it('should not read file when tofu_version_file is not provided', async () => {
      jest.spyOn(fs, 'readFile');

      getInput.mockImplementation((name) => {
        if (name === 'tofu_version') {
          return fallbackVersion;
        }
        return '';
      });

      await setup();

      expect(getRelease).toHaveBeenCalledWith(
        fallbackVersion,
        process.env.GITHUB_TOKEN
      );

      expect(fs.readFile).not.toHaveBeenCalled();
    });
  });

  describe('caching functionality', () => {
    it('should use cached version when cache is enabled and found', async () => {
      tc.find.mockReturnValue('/mock/cached/path');

      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'true',
          github_token: '',
          checksums: ''
        };
        return defaults[name] || '';
      });

      await setup();

      expect(tc.find).toHaveBeenCalledWith('tofu', '1.10.5', expect.any(String));
      expect(tc.downloadTool).not.toHaveBeenCalled();
      expect(tc.extractZip).not.toHaveBeenCalled();
      expect(tc.cacheDir).not.toHaveBeenCalled();
    });

    it('should download and cache when cache is enabled but not found', async () => {
      tc.find.mockReturnValue(null); // Cache miss

      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'true',
          github_token: '',
          checksums: ''
        };
        return defaults[name] || '';
      });

      await setup();

      expect(tc.find).toHaveBeenCalledWith('tofu', '1.10.5', expect.any(String));
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractZip).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalledWith('/mock/extract/path', 'tofu', '1.10.5', expect.any(String));
    });

    it('should download and cache when cache is enabled but not found', async () => {
      tc.find.mockReturnValue(null); // Cache miss

      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'true',
          github_token: ''
        };
        return defaults[name] || '';
      });

      await setup();

      expect(tc.find).toHaveBeenCalledWith('tofu', '1.10.5', expect.any(String));
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractZip).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalledWith('/mock/extract/path', 'tofu', '1.10.5', expect.any(String));
    });

    it('should not use cache when cache is disabled', async () => {
      tc.find.mockReturnValue('/mock/cached/path');

      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'false',
          github_token: '',
          checksums: ''
        };
        return defaults[name] || '';
      });

      await setup();

      expect(tc.find).not.toHaveBeenCalled();
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractZip).toHaveBeenCalled();
      expect(tc.cacheDir).not.toHaveBeenCalled();
    });
  });

  describe('checksum validation', () => {
    // Create a mock for fileSHA256 that we'll use in all tests
    const fileSHA256 = jest.fn();
    
    beforeAll(async () => {
      // Mock the fileSHA256 function directly on the imported module
      const module = await import('../setup-tofu.js');
      jest.unstable_mockModule('../setup-tofu.js', () => ({
        default: module.default,
        fileSHA256: fileSHA256
      }));
    });
    
    beforeEach(() => {
      // Clear all mocks between tests
      fileSHA256.mockReset();
      jest.clearAllMocks();
    });
    
    it('should download and validate checksum when checksums are provided', async () => {
      const mockChecksum = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';
      const mockFilePath = '/mock/download/path';
      
      // Set up the mock to return our test checksum
      fileSHA256.mockResolvedValue(mockChecksum);

      tc.find.mockReturnValue(null); // Cache miss
      tc.downloadTool.mockResolvedValue(mockFilePath);

      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'false',
          github_token: ''
        };
        return defaults[name] || '';
      });
      getMultilineInput.mockImplementation((name) => {
        const defaults = {
          checksums: mockChecksum

        };
        return defaults[name] || '';
      });




      const setupModule = await import('../setup-tofu.js');
      const { default: setup } = setupModule;
      
      await setup();
      
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(fileSHA256).toHaveBeenCalled();
    });

    it('should throw error when checksum validation fails', async () => {
      const mockChecksum = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';
      const mockInvalidChecksum = 'invalidchecksuminvalidchecksuminvalidchecksuminvalidchecksum';
      const mockFilePath = '/mock/download/path';
      
      // Set up the mock to return an invalid checksum
      fileSHA256.mockResolvedValue(mockInvalidChecksum);
      
      tc.find.mockReturnValue(null); // Cache miss
      tc.downloadTool.mockResolvedValue(mockFilePath);
      
      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'false',
          github_token: '',
          checksums: mockChecksum
        };
        return defaults[name] || '';
      });

      const setupModule = await import('../setup-tofu.js');
      const { default: setup } = setupModule;
      
      await expect(setup()).rejects.toThrow(
        `Failed to download OpenTofu from mock-url: Invalid checksum ${mockInvalidChecksum}`
      );
      
      expect(fileSHA256).toHaveBeenCalled();
    });

    it('should skip checksum validation when no checksums are provided', async () => {
      const mockFilePath = '/mock/download/path';
      
      tc.find.mockReturnValue(null); // Cache miss
      tc.downloadTool.mockResolvedValue(mockFilePath);
      
      getInput.mockImplementation((name) => {
        const defaults = {
          tofu_version: fallbackVersion,
          tofu_version_file: '',
          cli_config_credentials_hostname: '',
          cli_config_credentials_token: '',
          tofu_wrapper: 'true',
          cache: 'false',
          github_token: '',
          checksums: ''
        };
        return defaults[name] || '';
      });

      const setupModule = await import('../setup-tofu.js');
      const { default: setup } = setupModule;
      
      await setup();
      
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(fileSHA256).not.toHaveBeenCalled();
    });
  });
});
