import { createHash } from 'crypto';
import {createReadStream} from 'fs'
import { pipeline } from 'stream/promises';

export async function fileSHA256 (filePath) {
  const hash = createHash('sha256');
  const fileStream = createReadStream(filePath); // eslint-disable-line security/detect-non-literal-fs-filename

  await pipeline(fileStream, hash);
  return hash.digest('hex');
}
