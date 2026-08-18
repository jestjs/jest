/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export * from 'data:text/javascript,export const hasJest = typeof import.meta.jest; export const resolveType = typeof import.meta.resolve; let relativeError; try { import.meta.resolve("./x.js"); } catch (error) { relativeError = error.code; } export {relativeError}; let bareError; try { import.meta.resolve("bare-pkg"); } catch (error) { bareError = error.code; } export {bareError}; export const absolute = import.meta.resolve("node:fs");';
