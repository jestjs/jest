/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const winston = require('winston');
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

test('using winston should not fail', () => {
  logger.log('info', 'Log message from winston');

  logger.info('Info message from winston');

  logger.warn('Warn message from winston');

  logger.error('Error message from winston');
});
