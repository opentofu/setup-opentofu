diff --git a/lib/setup-tofu.js b/lib/setup-tofu.js
index 922c70e..22331f1 100644
--- a/lib/setup-tofu.js
+++ b/lib/setup-tofu.js
@@ -9,6 +9,9 @@ import { promises as fs } from 'fs';
 import { platform, arch } from 'os';
 import { sep, resolve, dirname } from 'path';
 import { fileURLToPath } from 'url';
+import { createHash } from 'crypto';
+import {createReadStream} from 'fs'
+import { pipeline } from 'stream/promises';
 
 // External
 import {
@@ -16,6 +19,7 @@ import {
   error as logError,
   exportVariable,
   getInput,
+  getMultilineInput,
   warning,
   addPath
 } from '@actions/core';
@@ -46,11 +50,17 @@ function mapOS (os) {
   return os;
 }
 
-async function downloadAndExtractCLI (url) {
+async function downloadAndExtractCLI (url, checksums) {
   debug(`Downloading OpenTofu CLI from ${url}`);
   let pathToCLIZip;
   try {
     pathToCLIZip = await downloadTool(url);
+    if (checksums.length > 0) {
+      const checksum = await fileSHA256(pathToCLIZip);
+      if (!checksums.includes(checksum)) {
+        throw new Error(`Failed to download OpenTofu from ${url}: Invalid checksum ${checksum}`);
+      }
+    }
   } catch (error) {
     const cause = getErrorMessage(error);
     throw new Error(`Failed to download OpenTofu from ${url}: ${cause}`);
@@ -87,6 +97,14 @@ async function downloadAndExtractCLI (url) {
   return pathToCLI;
 }
 
+async function fileSHA256(filePath) {
+  const hash = createHash('sha256');
+  const fileStream = createReadStream(filePath); // eslint-disable-line security/detect-non-literal-fs-filename
+
+  await pipeline(fileStream, hash);
+  return hash.digest('hex');
+}
+
 async function installWrapper (pathToCLI) {
   let source, target;
 
@@ -162,6 +180,7 @@ async function run () {
     const credentialsToken = getInput('cli_config_credentials_token');
     const wrapper = getInput('tofu_wrapper') === 'true';
     const useCache = getInput('cache') === 'true';
+    const checksums = getMultilineInput('checksums') || [];
     let githubToken = getInput('github_token');
     if (
       githubToken === '' &&
@@ -217,12 +236,12 @@ async function run () {
         pathToCLI = cachedPath;
       } else {
         debug(`OpenTofu version ${release.version} not found in cache, downloading...`);
-        const extractedPath = await downloadAndExtractCLI(build.url);
+        const extractedPath = await downloadAndExtractCLI(build.url, checksums);
         debug(`Caching OpenTofu version ${release.version} to tool cache`);
         pathToCLI = await cacheDir(extractedPath, 'tofu', release.version, buildArch);
       }
     } else {
-      pathToCLI = await downloadAndExtractCLI(build.url);
+      pathToCLI = await downloadAndExtractCLI(build.url, checksums);
     }
 
     // Install our wrapper
