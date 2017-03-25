// Copyright 2004-present Facebook. All Rights Reserved.

function awaitable() {
  return Promise.resolve();
}

module.exports.syncMethod = () => 42;

module.exports.asyncMethod = async () => {
  await awaitable();
  return 42;
};
