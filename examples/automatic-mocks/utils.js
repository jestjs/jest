// Copyright 2004-present Facebook. All Rights Reserved.

export default {
  authorize: () => 'token',
  isAuthorized: secret => secret === 'wizard',
};
