'use strict';

/* eslint-disable */

// taken from https://github.com/chalk/supports-color

var hasFlag = require('has-flag');

console.log(1);
var support = function(level) {
  console.log(2, {level});
  if (level === 0) {
    console.log('level === 0');
    return false;
  }
  console.log(3);

  return {
    level: level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  };
};

var supportLevel = (function() {
  console.log(4);
  console.log({
    noColor: hasFlag('no-color'),
    noColors: hasFlag('no-colors'),
    colorsFalse: hasFlag('color=false'),
  });
  if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false')) {
    console.log(5);
    return 0;
  }

  console.log(6);

  console.log({
    '16m': hasFlag('color=16=m'),
    full: hasFlag('color=full'),
    truecolor: hasFlag('color=truecolor'),
  });
  if (
    hasFlag('color=16m') ||
    hasFlag('color=full') ||
    hasFlag('color=truecolor')
  ) {
    console.log(7);
    return 3;
  }

  console.log(8);
  console.log({
    '256': hasFlag('color=256'),
  });
  if (hasFlag('color=256')) {
    console.log(9);
    return 2;
  }

  console.log(10);
  console.log({
    color: hasFlag('color'),
    colors: hasFlag('colors'),
    colorTrue: hasFlag('color=true'),
    colorAlways: hasFlag('color=always'),
  });
  if (
    hasFlag('color') ||
    hasFlag('colors') ||
    hasFlag('color=true') ||
    hasFlag('color=always')
  ) {
    console.log(11);
    return 1;
  }

  console.log(12);
  console.log({
    isTTy: process.stdout && !process.stdout.isTTY,
  });
  if (process.stdout && !process.stdout.isTTY) {
    console.log(13);
    return 0;
  }

  console.log(14);
  console.log({platform: process.platform});
  if (process.platform === 'win32') {
    console.log(15);
    return 1;
  }
  console.log(16);

  console.log({COLORTERM: process.env.COLORTERM});
  if ('COLORTERM' in process.env) {
    console.log(17);
    return 1;
  }

  console.log(18);
  console.log({TERM: process.env.TERM});
  if (process.env.TERM === 'dumb') {
    console.log(19);
    return 0;
  }

  console.log(20);
  if (/^xterm-256(?:color)?/.test(process.env.TERM)) {
    console.log(21);
    return 2;
  }

  console.log(22);
  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
    console.log(23);
    return 1;
  }

  console.log(24);
  return 0;
})();

console.log(25);
if (supportLevel === 0 && 'FORCE_COLOR' in process.env) {
  console.log(26);
  supportLevel = 1;
}

console.log({supportLevel});
const result = process && support(supportLevel);
console.log({result});

module.exports = result;
