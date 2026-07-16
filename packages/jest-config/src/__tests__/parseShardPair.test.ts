/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {parseShardPair} from '../parseShardPair';

it('raises an exception if shard has wrong format', () => {
  expect(() => parseShardPair('mumble')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if shard pair has to many items', () => {
  expect(() => parseShardPair('1/2/3')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if shard has floating points', () => {
  expect(() => parseShardPair('1.0/1')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if first item in shard pair is no number', () => {
  expect(() => parseShardPair('a/1')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if second item in shard pair is no number', () => {
  expect(() => parseShardPair('1/a')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if shard contains negative number', () => {
  expect(() => parseShardPair('1/-1')).toThrow(
    'string in the format of <n>/<m>',
  );
});

it('raises an exception if shard is zero-indexed', () => {
  expect(() => parseShardPair('0/1')).toThrow(
    'requires 1-based values, received 0',
  );
});

it('raises an exception if shard index is larger than shard count', () => {
  expect(() => parseShardPair('2/1')).toThrow(
    'requires <n> to be lower or equal than <m>',
  );
});

it('allows valid shard format', () => {
  expect(() => parseShardPair('1/2')).not.toThrow();
});
