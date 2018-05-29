'use strict';

module.exports = function() {
  const points = 10000;
  let inside = 0;

  for (let i = 0; i < points; i++) {
    if (Math.pow(Math.random(), 2) + Math.pow(Math.random(), 2) <= 1) {
      inside++;
    }
  }

  return (4 * inside) / points;
};
