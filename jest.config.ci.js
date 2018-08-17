'use strict';

// Object spread is just node 8
module.exports = Object.assign({}, require('./jest.config'), {
  reporters: ['jest-junit', 'jest-silent-reporter'],
});
