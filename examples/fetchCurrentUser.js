var $ = require('jquery');

function parseUserJson(userJson) {
  return {
    loggedIn: true,
    fullName: userJson.firstName + ' ' + userJson.lastName
  };
};

function fetchCurrentUser(callback) {
  function ajaxDone(userJson) {
    var user = parseUserJson(userJson);
    callback(user); // if you comment this line, the test will break
  };

  return $.ajax({
    type: 'GET',
    url: 'http://example.com/currentUser',
    done: ajaxDone
  });
};

module.exports = fetchCurrentUser;
