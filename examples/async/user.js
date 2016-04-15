// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

import request from './request';

export function getUserName(userID) {
  return request('/users/' + userID).then(user => user.name);
}
