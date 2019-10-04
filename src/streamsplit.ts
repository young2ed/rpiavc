'use strict';

import { Transform, TransformOptions } from 'stream'

export default class Splitter extends Transform {
  offset: number;
  bodyOffset: number;
  bufferSize: number;
  bufferFlush: number;
  buffer: Buffer;
  separator: Buffer;

  constructor(separator: Buffer, options: TransformOptions) {
    super(options);

    this.offset = 0;
    this.bodyOffset = 0;

    this.bufferSize = 1024 * 1024 * 1; //1Mb
    this.bufferFlush = Math.floor(this.bufferSize * 0.1); //10% buffer size
    // this.bufferSize = options.bufferSize || 1024 * 1024 * 1; //1Mb
    // this.bufferFlush = options.bufferFlush || Math.floor(this.bufferSize * 0.1); //10% buffer size

    this.buffer = Buffer.alloc(this.bufferSize);
    this.buffer.fill(0);
    this.separator = separator;
  }

  _transform(chunk, encoding, next) {

    if (this.offset + chunk.length > this.bufferSize - this.bufferFlush) {
      const minimalLength = this.bufferSize - this.bodyOffset + chunk.length;
      if (this.bufferSize < minimalLength) {
        //console.warn("Increasing buffer size to ", minimalLength);
        this.bufferSize = minimalLength;
      }

      const tmp = Buffer.alloc(this.bufferSize);
      this.buffer.copy(tmp, 0, this.bodyOffset);
      this.buffer = tmp;
      this.offset = this.offset - this.bodyOffset;
      this.bodyOffset = 0;
    }

    chunk.copy(this.buffer, this.offset);

    let i: number, start: number;
    let stop = this.offset + chunk.length;

    do {
      start = Math.max(this.bodyOffset ? this.bodyOffset : 0, this.offset - this.separator.length);
      i = this.buffer.slice(start, stop).indexOf(this.separator);

      if (i == -1)
        break;

      i += start;
      const img = this.buffer.slice(this.bodyOffset, i);
      this.push(img);
      this.bodyOffset = i + this.separator.length;
    } while (true);

    this.offset += chunk.length;
    next();
  }
};