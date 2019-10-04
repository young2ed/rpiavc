'use strict';

import * as fs from 'fs';
import WebSocket from 'ws';
import RPIStream from './rpistream';

const PI_MODEL_NO = [
  'BCM2708',
  'BCM2709',
  'BCM2710',
  'BCM2835',
  'BCM2837B0'
];

const isPiModel = (model: string) => {
  return PI_MODEL_NO.indexOf(model) > -1;
}

const isRPI = () => {
  let cpuInfo: string;

  try {
    cpuInfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' });
  } catch (e) {
    return false;
  }

  const model = cpuInfo
    .split('\n')
    .map(line => line.replace(/\t/g, ''))
    .filter(line => line.length > 0)
    .map(line => line.split(':'))
    .map(pair => pair.map(entry => entry.trim()))
    .filter((pair: string[]) => pair[0] === 'Hardware');

  if (!model || model.length == 0) {
    return false;
  }

  const number = model[0][1];
  return isPiModel(number);
}

if (!isRPI()) throw new Error('Invalid Hardware: Only RPI Supported');

const wss = new WebSocket.Server({
  port: 8080,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed.
  }
});

const videoStream = RPIStream({});

// wss.on('connection', (ws) => {
//   ws.on('message', (message) => {
//     console.log('received: %s', message);
//   });
// });

videoStream.on('data', (d: Buffer) => {
  wss.clients.forEach((client) => {
    if (client.OPEN) {
      client.send(d);
    }
  });
});