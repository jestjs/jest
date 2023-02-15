// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

export default {
  authorize: () => 'token',
  isAuthorized: secret => secret === 'wizard',
};
