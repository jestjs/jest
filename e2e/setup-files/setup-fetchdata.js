/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fetchedData = require('./fetched-data');

function mockFetchData(mockData) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockData);
    }, 2000);
  });
}

module.exports = async () => {
  const response = await mockFetchData('mock-fetched-data');
  fetchedData.RESPONSE = response;
};
