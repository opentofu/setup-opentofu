const pkg = require('../releases');

function mockFetchReleases () {
  const mockReleasesMeta = [{
    tag_name: 'v1.6.0-alpha2',
    assets: [{
      name: 'tofu_1.6.0-alpha2_386.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_386.apk'
    }, {
      name: 'tofu_1.6.0-alpha2_386.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_386.deb'
    }, {
      name: 'tofu_1.6.0-alpha2_386.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_386.rpm'
    }, {
      name: 'tofu_1.6.0-alpha2_amd64.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_amd64.apk'
    }, {
      name: 'tofu_1.6.0-alpha2_amd64.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_amd64.deb'
    }, {
      name: 'tofu_1.6.0-alpha2_amd64.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_amd64.rpm'
    }, {
      name: 'tofu_1.6.0-alpha2_arm.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm.apk'
    }, {
      name: 'tofu_1.6.0-alpha2_arm.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm.deb'
    }, {
      name: 'tofu_1.6.0-alpha2_arm.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm.rpm'
    }, {
      name: 'tofu_1.6.0-alpha2_arm64.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm64.apk'
    }, {
      name: 'tofu_1.6.0-alpha2_arm64.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm64.deb'
    }, {
      name: 'tofu_1.6.0-alpha2_arm64.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_arm64.rpm'
    }, {
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_darwin_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_darwin_arm64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_darwin_arm64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_freebsd_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_freebsd_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_freebsd_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_freebsd_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_freebsd_arm.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_freebsd_arm.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_linux_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_linux_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_linux_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_linux_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_linux_arm.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_linux_arm.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_linux_arm64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_linux_arm64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_openbsd_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_openbsd_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_openbsd_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_openbsd_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_SHA256SUMS',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_SHA256SUMS'
    }, {
      name: 'tofu_1.6.0-alpha2_SHA256SUMS.pem',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_SHA256SUMS.pem'
    }, {
      name: 'tofu_1.6.0-alpha2_SHA256SUMS.sig',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_SHA256SUMS.sig'
    }, {
      name: 'tofu_1.6.0-alpha2_solaris_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_solaris_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_windows_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_windows_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha2_windows_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha2/tofu_1.6.0-alpha2_windows_amd64.zip'
    }]
  }, {
    tag_name: 'v1.6.0-alpha1',
    assets: [{
      name: 'tofu_1.6.0-alpha1_386.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_386.apk'
    }, {
      name: 'tofu_1.6.0-alpha1_386.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_386.deb'
    }, {
      name: 'tofu_1.6.0-alpha1_386.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_386.rpm'
    }, {
      name: 'tofu_1.6.0-alpha1_amd64.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_amd64.apk'
    }, {
      name: 'tofu_1.6.0-alpha1_amd64.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_amd64.deb'
    }, {
      name: 'tofu_1.6.0-alpha1_amd64.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_amd64.rpm'
    }, {
      name: 'tofu_1.6.0-alpha1_arm.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm.apk'
    }, {
      name: 'tofu_1.6.0-alpha1_arm.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm.deb'
    }, {
      name: 'tofu_1.6.0-alpha1_arm.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm.rpm'
    }, {
      name: 'tofu_1.6.0-alpha1_arm64.apk',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm64.apk'
    }, {
      name: 'tofu_1.6.0-alpha1_arm64.deb',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm64.deb'
    }, {
      name: 'tofu_1.6.0-alpha1_arm64.rpm',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_arm64.rpm'
    }, {
      name: 'tofu_1.6.0-alpha1_darwin_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_darwin_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_darwin_arm64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_darwin_arm64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_freebsd_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_freebsd_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_freebsd_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_freebsd_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_freebsd_arm.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_freebsd_arm.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_linux_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_linux_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_linux_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_linux_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_linux_arm.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_linux_arm.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_linux_arm64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_linux_arm64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_openbsd_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_openbsd_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_openbsd_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_openbsd_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_SHA256SUMS',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_SHA256SUMS'
    }, {
      name: 'tofu_1.6.0-alpha1_SHA256SUMS.pem',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_SHA256SUMS.pem'
    }, {
      name: 'tofu_1.6.0-alpha1_SHA256SUMS.sig',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_SHA256SUMS.sig'
    }, {
      name: 'tofu_1.6.0-alpha1_solaris_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_solaris_amd64.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_windows_386.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_windows_386.zip'
    }, {
      name: 'tofu_1.6.0-alpha1_windows_amd64.zip',
      browser_download_url: 'https://github.com/opentofu/opentofu/releases/download/v1.6.0-alpha1/tofu_1.6.0-alpha1_windows_amd64.zip'
    }]
  }];

  return mockReleasesMeta.map(el => new pkg.Release(el));
}

describe('getRelease', () => {
  it('shall return \'1.6.0-alpha2\' release', async () => {
    const version = '<1.6.0-alpha3';
    const want = mockFetchReleases().find(el => el.version === '1.6.0-alpha2');
    const gotRelease = await pkg.getRelease(version, mockFetchReleases);
    expect(gotRelease).toEqual(want);
  });

  it('shall return the latest release', async () => {
    await pkg.getRelease('latest', mockFetchReleases);
  });
});
