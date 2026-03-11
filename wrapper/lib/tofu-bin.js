/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import os from 'os';
import path from 'path';

const tofuBin = (() => {
  // If we're on Windows, then the executable ends with .exe
  const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

  return [process.env.TOFU_CLI_PATH, `tofu-bin${exeSuffix}`].join(path.sep);
})();

export default tofuBin;
