// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import request from './request';

export function getUserName(userID) {
  return request(`/users/${userID}`).then(user => user.name);
}
