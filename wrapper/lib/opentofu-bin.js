/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const os = require('os');
const path = require('path');

module.exports = (() => {
  // If we're on Windows, then the executable ends with .exe
  const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

  return [process.env.OPENTOFU_CLI_PATH, `opentofu-bin${exeSuffix}`].join(path.sep);
})();
