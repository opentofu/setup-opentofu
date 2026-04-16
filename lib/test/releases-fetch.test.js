/**
 * Copyright (c) HashiCorp, Inc.
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 */

import { jest } from '@jest/globals';

// Mock @actions/http-client BEFORE importing releases so HttpClient is a mock
jest.unstable_mockModule('@actions/http-client', () => {
  const HttpCodes = {
    OK: 200,
    RequestTimeout: 408,
    TooManyRequests: 429,
    InternalServerError: 500,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504
  };
  class MockHttpClient {
    async get () {
      return MockHttpClient.__next();
    }
  }
  MockHttpClient.__responses = [];
  MockHttpClient.__next = () => {
    const r = MockHttpClient.__responses.shift();
    if (!r) throw new Error('Mock exhausted -- add another response');
    if (r instanceof Error) throw r;
    return r;
  };
  MockHttpClient.__reset = () => { MockHttpClient.__responses = []; };
  MockHttpClient.__enqueue = (r) => { MockHttpClient.__responses.push(r); };
  return { HttpClient: MockHttpClient, HttpCodes };
});

const { fetchReleases } = await import('../releases.js');
const { HttpClient } = await import('@actions/http-client');

function okBody (versions) {
  return {
    message: { statusCode: 200 },
    readBody: async () => JSON.stringify({ versions })
  };
}

function errBody (status) {
  return {
    message: { statusCode: status },
    readBody: async () => ''
  };
}

const sampleVersions = [
  { id: 'v1.9.0', files: ['tofu_1.9.0_linux_amd64.zip'] }
];

describe('fetchReleases retry/backoff', () => {
  beforeEach(() => {
    HttpClient.__reset();
  });

  test('succeeds on first attempt without retry', async () => {
    HttpClient.__enqueue(okBody(sampleVersions));
    const sleepFn = jest.fn(async () => {});
    const backoffFn = jest.fn(() => 0);
    const releases = await fetchReleases(undefined, { sleepFn, backoffFn });
    expect(releases).toHaveLength(1);
    expect(releases[0].version).toBe('1.9.0');
    expect(sleepFn).not.toHaveBeenCalled();
  });

  test('retries on 503 then succeeds', async () => {
    HttpClient.__enqueue(errBody(503));
    HttpClient.__enqueue(errBody(503));
    HttpClient.__enqueue(okBody(sampleVersions));
    const sleepFn = jest.fn(async () => {});
    const backoffFn = jest.fn(() => 0);
    const releases = await fetchReleases(undefined, { sleepFn, backoffFn });
    expect(releases).toHaveLength(1);
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(backoffFn).toHaveBeenCalledWith(0);
    expect(backoffFn).toHaveBeenCalledWith(1);
  });

  test('retries on 429 (rate-limit)', async () => {
    HttpClient.__enqueue(errBody(429));
    HttpClient.__enqueue(okBody(sampleVersions));
    const sleepFn = jest.fn(async () => {});
    const backoffFn = jest.fn(() => 0);
    const releases = await fetchReleases(undefined, { sleepFn, backoffFn });
    expect(releases).toHaveLength(1);
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  test('retries on network error (thrown from http.get)', async () => {
    HttpClient.__enqueue(new Error('ECONNRESET'));
    HttpClient.__enqueue(okBody(sampleVersions));
    const sleepFn = jest.fn(async () => {});
    const backoffFn = jest.fn(() => 0);
    const releases = await fetchReleases(undefined, { sleepFn, backoffFn });
    expect(releases).toHaveLength(1);
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  test('does NOT retry on 404 (permanent failure)', async () => {
    HttpClient.__enqueue(errBody(404));
    const sleepFn = jest.fn(async () => {});
    await expect(
      fetchReleases(undefined, { sleepFn, backoffFn: () => 0 })
    ).rejects.toThrow('failed fetching releases (404)');
    expect(sleepFn).not.toHaveBeenCalled();
  });

  test('does NOT retry on malformed JSON (permanent failure)', async () => {
    HttpClient.__enqueue({
      message: { statusCode: 200 },
      readBody: async () => '{not json'
    });
    const sleepFn = jest.fn(async () => {});
    await expect(
      fetchReleases(undefined, { sleepFn, backoffFn: () => 0 })
    ).rejects.toThrow(/Invalid releases JSON/);
    expect(sleepFn).not.toHaveBeenCalled();
  });

  test('gives up after maxAttempts and throws last error', async () => {
    HttpClient.__enqueue(errBody(503));
    HttpClient.__enqueue(errBody(503));
    HttpClient.__enqueue(errBody(503));
    const sleepFn = jest.fn(async () => {});
    await expect(
      fetchReleases(undefined, { maxAttempts: 3, sleepFn, backoffFn: () => 0 })
    ).rejects.toThrow('failed fetching releases (503)');
    expect(sleepFn).toHaveBeenCalledTimes(2); // 2 sleeps between 3 attempts
  });
});
