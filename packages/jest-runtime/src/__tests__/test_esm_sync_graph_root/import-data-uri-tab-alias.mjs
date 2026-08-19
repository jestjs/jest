/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as plain from 'data:text/javascript,export const url = import.meta.url;';
import * as tabbed from 'data:text/java	script,export const url = import.meta.url;';

export const sameInstance = plain === tabbed;
export const url = plain.url;
