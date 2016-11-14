// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

const $ = require('jquery');

function parseJSON(user) {
  return {
    fullName: user.firstName + ' ' + user.lastName,
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
