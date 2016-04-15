// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

const $ = require('jquery');

function parseJSON(user) {
  return {
    loggedIn: true,
    fullName: user.firstName + ' ' + user.lastName,
  };
}

function fetchCurrentUser(callback) {
  return $.ajax({
    type: 'GET',
    url: 'http://example.com/currentUser',
    success: user => callback(parseJSON(user)),
  });
}

module.exports = fetchCurrentUser;
