// Copyright 2004-present Facebook. All Rights Reserved.

const utils = jest.genMockFromModule('./utils');
// All implementation from original urils module is now mocked

utils.isAuthorized = secret => {
  console.log(123123123123);
  return secret === 'not_wizzard';
};

// ?BUG?: export default not working correctly..
module.exports = utils;
