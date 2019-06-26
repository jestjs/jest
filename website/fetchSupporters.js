#!/usr/bin/env node

// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

const fs = require('fs');
const request = require('request');
const path = require('path');

const REQUIRED_KEYS = ['fromAccount', 'tier', 'totalDonations'];

request(
  'https://rest.opencollective.com/v2/jest/orders/incoming/active?limit=1000',
  (err, response, body) => {
    if (err) console.error('Failed to fetch backers: ', err);

    // Basic validation
    const result = JSON.parse(body);
    if (!result || !Array.isArray(result.nodes)) {
      throw new Error('backer info is not an array');
    }

    const backers = result.nodes;

    for (const item of backers) {
      for (const key of REQUIRED_KEYS) {
        if (!item || typeof item !== 'object')
          throw new Error(
            `backer info item (${JSON.stringify(item)} is not an object`
          );
        if (!(key in item))
          throw new Error(
            `backer info item (${JSON.stringify(item)} doesn't include ${key}`
          );
      }
    }

    fs.writeFile(
      path.resolve(__dirname, 'backers.json'),
      JSON.stringify(backers),
      err => {
        if (err) {
          console.error('Failed to write backers file: ', err);
        } else console.log('Fetched 1 file: backers.json');
      }
    );
  }
);
