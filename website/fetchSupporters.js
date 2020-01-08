#!/usr/bin/env node

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs').promises;
const {request} = require('graphql-request');
const path = require('path');

const graphqlQuery = `
  {
    account(slug: "jest") {
      orders(status: ACTIVE, limit: 1000) {
        nodes {
          tier {
            slug
          }
          fromAccount {
            name
            slug
            website
            imageUrl
          }
          totalDonations {
            value
          }
        }
      }
    }
  }
`;

request('https://api.opencollective.com/graphql/v2', graphqlQuery)
  .then(data => {
    const backers = data.account.orders.nodes;

    return fs.writeFile(
      path.resolve(__dirname, 'backers.json'),
      JSON.stringify(backers)
    );
  })
  .then(() => {
    console.log('Fetched 1 file: backers.json');
  })
  .catch(e => {
    console.error('Failed to write backers file: ', e);
    process.exitCode = 1;
  });
