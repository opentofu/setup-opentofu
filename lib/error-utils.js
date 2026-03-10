/**
 * Copyright (c) OpenTofu
 * SPDX-License-Identifier: MPL-2.0
 *
 * Normalizes errors (including AggregateError from fetch/undici) into
 * a single, actionable message for GitHub Actions logs.
 */

/**
 * Get a user-friendly message from any error.
 * - AggregateError: flattens error.errors so network/download causes are visible.
 * - Standard Error: returns message; includes cause if present (Node 16+).
 *
 * @param {unknown} error - Caught value (Error, AggregateError, or other).
 * @returns {string} Single-line message suitable for core.setFailed().
 */
function getErrorMessage (error) {
  if (error instanceof AggregateError && Array.isArray(error.errors)) {
    if (error.errors.length === 0) {
      return 'AggregateError (one or more operations failed)';
    }
    const parts = error.errors.map((e) => (e && typeof e.message === 'string' ? e.message : String(e)));
    const combined = parts.join('; ');
    return combined || 'AggregateError (one or more operations failed)';
  }

  if (error instanceof Error) {
    if (error.cause instanceof Error) {
      return `${error.message}: ${error.cause.message}`;
    }
    return error.message;
  }

  return String(error);
}

/**
 * Get a detailed string for logging (e.g. core.debug or core.error).
 * Includes stack and, for AggregateError, each nested error.
 *
 * @param {unknown} error - Caught value.
 * @returns {string} Multi-line detail string.
 */
function getErrorDetail (error) {
  const lines = [];

  if (error instanceof AggregateError && Array.isArray(error.errors)) {
    lines.push(`AggregateError (${error.errors.length} error(s)):`);
    error.errors.forEach((e, i) => {
      lines.push(`  [${i + 1}] ${e instanceof Error ? e.message : String(e)}`);
      if (e instanceof Error && e.stack) {
        lines.push(e.stack.split('\n').map((l) => '    ' + l).join('\n'));
      }
    });
    if (error.stack) {
      lines.push('Outer stack:');
      lines.push(error.stack);
    }
    return lines.join('\n');
  }

  if (error instanceof Error) {
    lines.push(error.message);
    if (error.stack) lines.push(error.stack);
    if (error.cause) {
      lines.push('Caused by:');
      lines.push(getErrorDetail(error.cause));
    }
    return lines.join('\n');
  }

  return String(error);
}

export { getErrorMessage, getErrorDetail };
