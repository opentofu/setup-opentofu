/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { setFailed } from '@actions/core';

import setup from './lib/setup-tofu.js';

(async () => {
  try {
    await setup();
  } catch (error) {
    setFailed(error.message);
  }
})();
