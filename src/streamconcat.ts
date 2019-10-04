'use strict';

import { Transform, TransformOptions } from 'stream'
import * as util from 'util'

export default function StreamConcat (streams, options) {
  if (!options)
    options = {};

  Transform.call(this, options);

  let self = this;

  this.streams = streams;
  this.canAddStream = true;
  this.currentStream = null;
  this.streamIndex = 0;
  const nextStream = () => {
    self.currentStream = null;
    if (self.streams.constructor === Array && self.streamIndex < self.streams.length) {
      self.currentStream = self.streams[self.streamIndex++];
    } else if (typeof self.streams === 'function') {
      this.canAddStream = false;
      self.currentStream = self.streams();
    }

    if (self.currentStream === null) {
      this.canAddStream = false;
      self.end();
    } else {
      self.currentStream.pipe(self, { end: false });
      let streamClosed = false;
      const goNext = () => {
        if (streamClosed) {
          return;
        }
        streamClosed = true;
        nextStream();
      };

      self.currentStream.on('end', goNext);
      if (options.advanceOnClose) {
        self.currentStream.on('close', goNext);
      }
    }
  };

  nextStream();
};

util.inherits(StreamConcat, Transform);

StreamConcat.prototype._transform = (chunk, encoding, callback) => {
  callback(null, chunk);
};

StreamConcat.prototype.addStream = (newStream) => {
  if (this.canAddStream)
    this.streams.push(newStream);
  else
    this.emit('error', new Error('Can\'t add stream.'));
};