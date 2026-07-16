// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

const $ = require('jquery');
const fetchCurrentUser = require('./fetchCurrentUser.js');

$('#button').click(() => {
  fetchCurrentUser(user => {
    const loggedText = `Logged ${user.loggedIn ? 'In' : 'Out'}`;
    $('#username').text(`${user.fullName} - ${loggedText}`);
  });
});
