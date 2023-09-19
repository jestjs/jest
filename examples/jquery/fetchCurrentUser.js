// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

const $ = require('jquery');

function parseJSON(user) {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    loggedIn: true,
  };
}

function fetchCurrentUser(callback) {
  return $.ajax({
    success: user => callback(parseJSON(user)),
    type: 'GET',
    url: 'http://example.com/currentUser',
  });
}

module.exports = fetchCurrentUser;
