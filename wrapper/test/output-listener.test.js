/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import OutputListener from '../lib/output-listener.js';
import { PassThrough } from 'stream';

describe('output-listener', () => {
  it('receives and exposes data', () => {
    const stream = new PassThrough();
    const listener = new OutputListener(stream);
    const listen = listener.listener;
    listen(Buffer.from('foo'));
    expect(stream.read()).toEqual(Buffer.from('foo'));
    listen(Buffer.from('bar'));
    expect(stream.read()).toEqual(Buffer.from('bar'));
    listen(Buffer.from('baz'));
    expect(stream.read()).toEqual(Buffer.from('baz'));
    expect(listener.contents).toEqual('foobarbaz');
  });
});
