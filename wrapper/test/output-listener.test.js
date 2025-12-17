/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const OutputListener = require('../lib/output-listener');
const { PassThrough } = require('stream');
describe('output-listener', () => {
  it('receives and exposes data', () => {  
    const listener = new OutputListener(new PassThrough());
    const listen = listener.listener;
    listen(Buffer.from('foo'));
    listen(Buffer.from('bar'));
    listen(Buffer.from('baz'));
    expect(listener.contents).toEqual('foobarbaz');
  });
});
