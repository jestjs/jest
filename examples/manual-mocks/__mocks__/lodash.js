// Copyright 2004-present Facebook. All Rights Reserved.

const lodash = jest.createMockFromModule('lodash');

lodash.head = arr => 5;

export default lodash;
