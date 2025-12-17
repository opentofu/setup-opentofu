/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Acts as a listener for @actions/exec, by capturing STDOUT and STDERR
 * streams, and exposing them via a contents attribute.
 *
 * @example
 * // Instantiate a new listener
 * // stream is used to write the data before waiting for the listener to complete
 * const listener = new OutputListener(stream);
 * // Register listener against STDOUT stream
 * await exec.exec('ls', ['-ltr'], {
 *  listeners: {
 *    stdout: listener.listener
 *  }
 * });
 * // Log out STDOUT contents
 * console.log(listener.contents);
 */
class OutputListener {
  constructor (stream) {
    this._buff = [];
    this._stream = stream;
  }

  get listener () {
    const listen = function listen (data) {
      this._stream.write(data);
      this._buff.push(data);
    };
    return listen.bind(this);
  }

  get contents () {
    return this._buff
      .map(chunk => chunk.toString())
      .join('');
  }
}

module.exports = OutputListener;
