/**
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

export async function fileSHA256 (filePath) {
  const hash = createHash('sha256');
  const fileStream = createReadStream(filePath);

  await pipeline(fileStream, hash);
  return hash.digest('hex');
}
