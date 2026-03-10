/**
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

const { getErrorMessage, getErrorDetail } = require('../error-utils');

describe('error-utils', () => {
  describe('getErrorMessage', () => {
    it('returns message for standard Error', () => {
      expect(getErrorMessage(new Error('Something failed'))).toBe('Something failed');
    });

    it('includes cause for Error with cause (Node 16+)', () => {
      const cause = new Error('Network timeout');
      const err = new Error('Download failed');
      err.cause = cause;
      expect(getErrorMessage(err)).toBe('Download failed: Network timeout');
    });

    it('flattens AggregateError into a single message', () => {
      const err = new AggregateError(
        [new Error('ECONNREFUSED'), new Error('getaddrinfo ENOTFOUND')],
        'AggregateError'
      );
      const msg = getErrorMessage(err);
      expect(msg).toContain('ECONNREFUSED');
      expect(msg).toContain('getaddrinfo ENOTFOUND');
      expect(msg).not.toBe('AggregateError');
    });

    it('returns fallback for AggregateError with empty errors', () => {
      const err = new AggregateError([], 'AggregateError');
      expect(getErrorMessage(err)).toBe('AggregateError (one or more operations failed)');
    });

    it('coerces non-Error to string', () => {
      expect(getErrorMessage('oops')).toBe('oops');
      expect(getErrorMessage(123)).toBe('123');
    });
  });

  describe('getErrorDetail', () => {
    it('includes stack for Error', () => {
      const err = new Error('test');
      const detail = getErrorDetail(err);
      expect(detail).toContain('test');
      expect(detail).toContain('Error');
    });

    it('includes each nested error for AggregateError', () => {
      const err = new AggregateError(
        [new Error('A'), new Error('B')],
        'AggregateError'
      );
      const detail = getErrorDetail(err);
      expect(detail).toContain('A');
      expect(detail).toContain('B');
      expect(detail).toContain('2 error(s)');
    });
  });
});
