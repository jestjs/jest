// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

import * as globals from './globals';

export {addEventHandler, getState} from './state';
export {EventHandler, Event, State} from './types';
export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
  it,
} from './globals';

// To avoid breaking change. Remove in Jest 25:
export default globals;
