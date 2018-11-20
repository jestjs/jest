// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import isCI from 'is-ci';

export default process.stdout.isTTY && process.env.TERM !== 'dumb' && !isCI;
