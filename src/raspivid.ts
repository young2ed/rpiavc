
import * as child from 'child_process';

export default function (options: object) {
  options = options || {};

  var args = [
    '--nopreview'
  ]

  Object.keys(options || {}).forEach(function (key) {
    args.push('--' + key);
    var val = options[key];
    if (val || val === 0) {
      args.push(val);
    }
  })

  args.push('-o')
  args.push('-')

  // the avconv stream that inherits stderr
  var video_process = child.spawn('raspivid', args, {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  return video_process.stdout;
}