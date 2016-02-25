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
    done: user => callback(parseJSON(user)),
  });
}

module.exports = fetchCurrentUser;
