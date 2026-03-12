#!/usr/bin/env node
/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const io = require('@actions/io');
const core = require('@actions/core');
const { spawn } = require('child_process');

const OutputListener = require('./lib/output-listener');
const pathToCLI = require('./lib/tofu-bin');

async function checkTofu () {
  // Setting check to `true` will cause `which` to throw if tofu isn't found
  const check = true;
  return io.which(pathToCLI, check);
}

(async () => {
  // This will fail if tofu isn't found, which is what we want
  await checkTofu();

  // Create listeners to receive output (in memory) as well
  const stdout = new OutputListener(process.stdout);
  const stderr = new OutputListener(process.stderr);

  // Execute tofu and capture output
  const args = process.argv.slice(2);
  const child = spawn(pathToCLI, args, { stdio: ['inherit', 'pipe', 'pipe'] });

  // Forward signals to child so tofu can release state locks on cancellation
  const forwardSigterm = () => { child.kill('SIGTERM'); };
  const forwardSigint = () => { child.kill('SIGINT'); };
  process.on('SIGTERM', forwardSigterm);
  process.on('SIGINT', forwardSigint);

  child.stdout.on('data', stdout.listener);
  child.stderr.on('data', stderr.listener);

  const exitCode = await new Promise((resolve) => {
    // code is null when the process is killed by a signal; treat as failure
    child.on('close', (code) => resolve(code ?? 1));
  });

  process.removeListener('SIGTERM', forwardSigterm);
  process.removeListener('SIGINT', forwardSigint);

  // Set outputs, result, exitcode, and stderr
  core.setOutput('stdout', stdout.contents);
  core.setOutput('stderr', stderr.contents);
  core.setOutput('exitcode', exitCode.toString(10));

  if (exitCode === 0 || exitCode === 2) {
    // A exitCode of 0 is considered a success
    // An exitCode of 2 may be returned when the '-detailed-exitcode' option
    // is passed to plan. This denotes Success with non-empty
    // diff (changes present).
    return;
  }

  // A non-zero exitCode is considered an error
  core.setFailed(`OpenTofu exited with code ${exitCode}.`);
})();
