'use strict';

import request from './request';

export async function getUserName(userID) {
  const user = await request('/users/' + userID);
  return user.name;
}
