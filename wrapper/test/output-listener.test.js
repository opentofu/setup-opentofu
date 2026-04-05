/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
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

  describe('parsePlanCounts', () => {
    it('parses add, change, and destroy counts', () => {
      const result = OutputListener.parsePlanCounts('Plan: 3 to add, 1 to change, 0 to destroy.');
      expect(result).toEqual({ add: 3, change: 1, destroy: 0, import: 0 });
    });

    it('parses all counts including import', () => {
      const result = OutputListener.parsePlanCounts('Plan: 2 to add, 0 to change, 0 to destroy, 1 to import.');
      expect(result).toEqual({ add: 2, change: 0, destroy: 0, import: 1 });
    });

    it('handles no changes', () => {
      const result = OutputListener.parsePlanCounts('No changes.');
      expect(result).toEqual({ add: 0, change: 0, destroy: 0, import: 0 });
    });

    it('handles empty or null input', () => {
      expect(OutputListener.parsePlanCounts('')).toEqual({ add: 0, change: 0, destroy: 0, import: 0 });
      expect(OutputListener.parsePlanCounts(null)).toEqual({ add: 0, change: 0, destroy: 0, import: 0 });
      expect(OutputListener.parsePlanCounts(undefined)).toEqual({ add: 0, change: 0, destroy: 0, import: 0 });
    });

    it('extracts from multi-line output', () => {
      const output = 'Some other output here\nPlan: 5 to add, 2 to change, 1 to destroy.\nMore output';
      const result = OutputListener.parsePlanCounts(output);
      expect(result).toEqual({ add: 5, change: 2, destroy: 1, import: 0 });
    });

    it('handles output without plan line', () => {
      const result = OutputListener.parsePlanCounts('Some random output without plan info');
      expect(result).toEqual({ add: 0, change: 0, destroy: 0, import: 0 });
    });
  });
});
