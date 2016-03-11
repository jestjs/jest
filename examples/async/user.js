'use strict';

import request from './request';

export function getUserName(userID) {
  return request('/users/' + userID).then(user => user.name);
}
