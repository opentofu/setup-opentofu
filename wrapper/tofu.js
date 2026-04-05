#!/usr/bin/env node
/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { which } from '@actions/io';
import { setOutput, setFailed } from '@actions/core';
import { exec } from '@actions/exec';

import OutputListener from './lib/output-listener.js';
import pathToCLI from './lib/tofu-bin.js';

async function checkTofu () {
  // Setting check to `true` will cause `which` to throw if tofu isn't found
  const check = true;
  return which(pathToCLI, check);
}

(async () => {
  // This will fail if tofu isn't found, which is what we want
  await checkTofu();

  // Create listeners to receive output (in memory) as well
  const stdout = new OutputListener(process.stdout);
  const stderr = new OutputListener(process.stderr);
  const listeners = {
    stdout: stdout.listener,
    stderr: stderr.listener
  };

  // Execute tofu and capture output
  const args = process.argv.slice(2);
  const options = {
    listeners,
    ignoreReturnCode: true,
    silent: true // don't print "[command...]" into stdout: https://github.com/actions/toolkit/issues/649
  };
  const exitCode = await exec(pathToCLI, args, options);

  // Set outputs, result, exitcode, and stderr
  setOutput('stdout', stdout.contents);
  setOutput('stderr', stderr.contents);
  setOutput('exitcode', exitCode.toString(10));

  if (exitCode === 0) {
    return;
  }

  if (exitCode === 2) {
    process.exit(2);
  }

  setFailed(`OpenTofu exited with code ${exitCode}.`);
  process.exit(exitCode);
})();
