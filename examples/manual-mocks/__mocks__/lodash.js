// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

const lodash = jest.createMockFromModule('lodash');

lodash.head = arr => 5;

export default lodash;
