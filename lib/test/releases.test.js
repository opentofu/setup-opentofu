const pkg = require('../releases');

describe('getRelease', () => {
  function mockFetchReleases () {
    const mockReleasesMeta = [{
      id: 'v1.7.0-alpha2',
      files: [
        'tofu_1.7.0-alpha2_386.apk',
        'tofu_1.7.0-alpha2_386.deb',
        'tofu_1.7.0-alpha2_386.rpm',
        'tofu_1.7.0-alpha2_amd64.apk',
        'tofu_1.7.0-alpha2_amd64.deb',
        'tofu_1.7.0-alpha2_amd64.rpm',
        'tofu_1.7.0-alpha2_arm.apk',
        'tofu_1.7.0-alpha2_arm.deb',
        'tofu_1.7.0-alpha2_arm.rpm',
        'tofu_1.7.0-alpha2_arm64.apk',
        'tofu_1.7.0-alpha2_arm64.deb',
        'tofu_1.7.0-alpha2_arm64.rpm',
        'tofu_1.7.0-alpha2_darwin_arm64.zip',
        'tofu_1.7.0-alpha2_freebsd_386.zip',
        'tofu_1.7.0-alpha2_freebsd_amd64.zip',
        'tofu_1.7.0-alpha2_freebsd_arm.zip',
        'tofu_1.7.0-alpha2_linux_386.zip',
        'tofu_1.7.0-alpha2_linux_amd64.zip',
        'tofu_1.7.0-alpha2_linux_arm.zip',
        'tofu_1.7.0-alpha2_linux_arm64.zip',
        'tofu_1.7.0-alpha2_openbsd_386.zip',
        'tofu_1.7.0-alpha2_openbsd_amd64.zip',
        'tofu_1.7.0-alpha2_SHA256SUMS',
        'tofu_1.7.0-alpha2_SHA256SUMS.pem',
        'tofu_1.7.0-alpha2_SHA256SUMS.sig',
        'tofu_1.7.0-alpha2_solaris_amd64.zip',
        'tofu_1.7.0-alpha2_windows_386.zip',
        'tofu_1.7.0-alpha2_windows_amd64.zip'
      ]
    }, {
      id: 'v1.6.0',
      files: [
        'tofu_1.6.0_386.apk',
        'tofu_1.6.0_386.deb',
        'tofu_1.6.0_386.rpm',
        'tofu_1.6.0_amd64.apk',
        'tofu_1.6.0_amd64.deb',
        'tofu_1.6.0_amd64.rpm',
        'tofu_1.6.0_arm.apk',
        'tofu_1.6.0_arm.deb',
        'tofu_1.6.0_arm.rpm',
        'tofu_1.6.0_arm64.apk',
        'tofu_1.6.0_arm64.deb',
        'tofu_1.6.0_arm64.rpm',
        'tofu_1.6.0_darwin_arm64.zip',
        'tofu_1.6.0_freebsd_386.zip',
        'tofu_1.6.0_freebsd_amd64.zip',
        'tofu_1.6.0_freebsd_arm.zip',
        'tofu_1.6.0_linux_386.zip',
        'tofu_1.6.0_linux_amd64.zip',
        'tofu_1.6.0_linux_arm.zip',
        'tofu_1.6.0_linux_arm64.zip',
        'tofu_1.6.0_openbsd_386.zip',
        'tofu_1.6.0_openbsd_amd64.zip',
        'tofu_1.6.0_SHA256SUMS',
        'tofu_1.6.0_SHA256SUMS.pem',
        'tofu_1.6.0_SHA256SUMS.sig',
        'tofu_1.6.0_solaris_amd64.zip',
        'tofu_1.6.0_windows_386.zip',
        'tofu_1.6.0_windows_amd64.zip']
    }, {
      id: 'v1.6.0-alpha2',
      files: [
        'tofu_1.6.0-alpha2_386.apk',
        'tofu_1.6.0-alpha2_386.deb',
        'tofu_1.6.0-alpha2_386.rpm',
        'tofu_1.6.0-alpha2_amd64.apk',
        'tofu_1.6.0-alpha2_amd64.deb',
        'tofu_1.6.0-alpha2_amd64.rpm',
        'tofu_1.6.0-alpha2_arm.apk',
        'tofu_1.6.0-alpha2_arm.deb',
        'tofu_1.6.0-alpha2_arm.rpm',
        'tofu_1.6.0-alpha2_arm64.apk',
        'tofu_1.6.0-alpha2_arm64.deb',
        'tofu_1.6.0-alpha2_arm64.rpm',
        'tofu_1.6.0-alpha2_darwin_arm64.zip',
        'tofu_1.6.0-alpha2_freebsd_386.zip',
        'tofu_1.6.0-alpha2_freebsd_amd64.zip',
        'tofu_1.6.0-alpha2_freebsd_arm.zip',
        'tofu_1.6.0-alpha2_linux_386.zip',
        'tofu_1.6.0-alpha2_linux_amd64.zip',
        'tofu_1.6.0-alpha2_linux_arm.zip',
        'tofu_1.6.0-alpha2_linux_arm64.zip',
        'tofu_1.6.0-alpha2_openbsd_386.zip',
        'tofu_1.6.0-alpha2_openbsd_amd64.zip',
        'tofu_1.6.0-alpha2_SHA256SUMS',
        'tofu_1.6.0-alpha2_SHA256SUMS.pem',
        'tofu_1.6.0-alpha2_SHA256SUMS.sig',
        'tofu_1.6.0-alpha2_solaris_amd64.zip',
        'tofu_1.6.0-alpha2_windows_386.zip',
        'tofu_1.6.0-alpha2_windows_amd64.zip'
      ]
    }, {
      id: 'v1.6.0-alpha1',
      files: [
        'tofu_1.6.0-alpha1_386.apk',
        'tofu_1.6.0-alpha1_386.deb',
        'tofu_1.6.0-alpha1_386.rpm',
        'tofu_1.6.0-alpha1_amd64.apk',
        'tofu_1.6.0-alpha1_amd64.deb',
        'tofu_1.6.0-alpha1_amd64.rpm',
        'tofu_1.6.0-alpha1_arm.apk',
        'tofu_1.6.0-alpha1_arm.deb',
        'tofu_1.6.0-alpha1_arm.rpm',
        'tofu_1.6.0-alpha1_arm64.apk',
        'tofu_1.6.0-alpha1_arm64.deb',
        'tofu_1.6.0-alpha1_arm64.rpm',
        'tofu_1.6.0-alpha1_darwin_amd64.zip',
        'tofu_1.6.0-alpha1_darwin_arm64.zip',
        'tofu_1.6.0-alpha1_freebsd_386.zip',
        'tofu_1.6.0-alpha1_freebsd_amd64.zip',
        'tofu_1.6.0-alpha1_freebsd_arm.zip',
        'tofu_1.6.0-alpha1_linux_386.zip',
        'tofu_1.6.0-alpha1_linux_amd64.zip',
        'tofu_1.6.0-alpha1_linux_arm.zip',
        'tofu_1.6.0-alpha1_linux_arm64.zip',
        'tofu_1.6.0-alpha1_openbsd_386.zip',
        'tofu_1.6.0-alpha1_openbsd_amd64.zip',
        'tofu_1.6.0-alpha1_SHA256SUMS',
        'tofu_1.6.0-alpha1_SHA256SUMS.pem',
        'tofu_1.6.0-alpha1_SHA256SUMS.sig',
        'tofu_1.6.0-alpha1_solaris_amd64.zip',
        'tofu_1.6.0-alpha1_windows_386.zip',
        'tofu_1.6.0-alpha1_windows_amd64.zip'
      ]
    }];

    return mockReleasesMeta.map(el => new pkg.Release(el));
  }

  it.each(
    [
      ['latest', '1.6.0'],
      ['<1.6.0-beta', '1.6.0-alpha2'],
      ['>1.6.0-alpha1', '1.6.0'],
      ['>1.6.0-alpha1 <1.6.0', '1.6.0-alpha2'],
      ['~1.6.0-alpha', '1.6.0'],
      ['<=1.6.0-alpha1', '1.6.0-alpha1'],
      ['>1.5.0', '1.6.0'],
      ['>1.5.0', '1.6.0'],
      ['>1.7.0-alpha', '1.7.0-alpha2']
    ]
  )('happy path: getRelease(\'%s\') -> \'%s\'', async (input, wantVersion) => {
    const want = mockFetchReleases().find(el => el.version === wantVersion);
    const gotRelease = await pkg.getRelease(input, '', mockFetchReleases);
    expect(gotRelease).toEqual(want);
  });

  it.each(
    [
      ['foo', 'Input version cannot be used, see semver: https://semver.org/spec/v2.0.0.html', mockFetchReleases],
      ['2.0', 'No matching version found', mockFetchReleases],
      ['latest', 'No tofu releases found, please contact OpenTofu', async () => {
        return null;
      }],
      ['latest', 'No tofu releases found, please contact OpenTofu', async () => {
        return [];
      }]
    ]
  )('unhappy path: getRelease(\'%s\') -> throw Error(\'%s\')', async (input, wantErrorMessage, mockFetchReleasesFn) => {
    try {
      await pkg.getRelease(input, '', mockFetchReleasesFn);
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toBe(wantErrorMessage);
    }
  });
});
