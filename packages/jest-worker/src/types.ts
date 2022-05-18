/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ForkOptions} from 'child_process';
import type {EventEmitter} from 'events';
import type {ResourceLimits} from 'worker_threads';

type ReservedKeys = 'end' | 'getStderr' | 'getStdout' | 'setup' | 'teardown';
type ExcludeReservedKeys<K> = Exclude<K, ReservedKeys>;

type FunctionLike = (...args: any) => unknown;

type MethodLikeKeys<T> = {
  [K in keyof T]: T[K] extends FunctionLike ? K : never;
}[keyof T];

type Promisify<T extends FunctionLike> = ReturnType<T> extends Promise<infer R>
  ? (...args: Parameters<T>) => Promise<R>
  : (...args: Parameters<T>) => Promise<ReturnType<T>>;

export type WorkerModule<T> = {
  [K in keyof T as Extract<
    ExcludeReservedKeys<K>,
    MethodLikeKeys<T>
  >]: T[K] extends FunctionLike ? Promisify<T[K]> : never;
};

// Because of the dynamic nature of a worker communication process, all messages
// coming from any of the other processes cannot be typed. Thus, many types
// include "unknown" as a TS type, which is (unfortunately) correct here.

export const CHILD_MESSAGE_INITIALIZE: 0 = 0;
export const CHILD_MESSAGE_CALL: 1 = 1;
export const CHILD_MESSAGE_END: 2 = 2;

export const PARENT_MESSAGE_OK: 0 = 0;
export const PARENT_MESSAGE_CLIENT_ERROR: 1 = 1;
export const PARENT_MESSAGE_SETUP_ERROR: 2 = 2;
export const PARENT_MESSAGE_CUSTOM: 3 = 3;

export type PARENT_MESSAGE_ERROR =
  | typeof PARENT_MESSAGE_CLIENT_ERROR
  | typeof PARENT_MESSAGE_SETUP_ERROR;

export type WorkerCallback = (
  workerId: number,
  request: ChildMessage,
  onStart: OnStart,
  onEnd: OnEnd,
  onCustomMessage: OnCustomMessage,
) => void;

export interface WorkerPoolInterface {
  getStderr(): NodeJS.ReadableStream;
  getStdout(): NodeJS.ReadableStream;
  getWorkers(): Array<WorkerInterface>;
  createWorker(options: WorkerOptions): WorkerInterface;
  send: WorkerCallback;
  end(): Promise<PoolExitResult>;
}

export interface WorkerInterface {
  send(
    request: ChildMessage,
    onProcessStart: OnStart,
    onProcessEnd: OnEnd,
    onCustomMessage: OnCustomMessage,
  ): void;
  waitForExit(): Promise<void>;
  forceExit(): void;

  getWorkerId(): number;
  getStderr(): NodeJS.ReadableStream | null;
  getStdout(): NodeJS.ReadableStream | null;
}

export type PoolExitResult = {
  forceExited: boolean;
};

export interface PromiseWithCustomMessage<T> extends Promise<T> {
  UNSTABLE_onCustomMessage?: (listener: OnCustomMessage) => () => void;
}

// Option objects.

export interface TaskQueue {
  /**
   * Enqueues the task in the queue for the specified worker or adds it to the
   * queue shared by all workers
   * @param task the task to queue
   * @param workerId the id of the worker that should process this task or undefined
   * if there's no preference.
   */
  enqueue(task: QueueChildMessage, workerId?: number): void;

  /**
   * Dequeues the next item from the queue for the specified worker
   * @param workerId the id of the worker for which the next task should be retrieved
   */
  dequeue(workerId: number): QueueChildMessage | null;
}

export type WorkerSchedulingPolicy = 'round-robin' | 'in-order';

export type WorkerFarmOptions = {
  computeWorkerKey?: (method: string, ...args: Array<unknown>) => string | null;
  enableWorkerThreads?: boolean;
  exposedMethods?: ReadonlyArray<string>;
  forkOptions?: ForkOptions;
  maxRetries?: number;
  numWorkers?: number;
  resourceLimits?: ResourceLimits;
  setupArgs?: Array<unknown>;
  taskQueue?: TaskQueue;
  WorkerPool?: new (
    workerPath: string,
    options?: WorkerPoolOptions,
  ) => WorkerPoolInterface;
  workerSchedulingPolicy?: WorkerSchedulingPolicy;
};

export type WorkerPoolOptions = {
  setupArgs: Array<unknown>;
  forkOptions: ForkOptions;
  resourceLimits: ResourceLimits;
  maxRetries: number;
  numWorkers: number;
  enableWorkerThreads: boolean;
};

export type WorkerOptions = {
  forkOptions: ForkOptions;
  resourceLimits: ResourceLimits;
  setupArgs: Array<unknown>;
  maxRetries: number;
  workerId: number;
  workerData?: unknown;
  workerPath: string;
};

// Messages passed from the parent to the children.

export type MessagePort = typeof EventEmitter & {
  postMessage(message: unknown): void;
};

export type MessageChannel = {
  port1: MessagePort;
  port2: MessagePort;
};

export type ChildMessageInitialize = [
  typeof CHILD_MESSAGE_INITIALIZE, // type
  boolean, // processed
  string, // file
  Array<unknown> | undefined, // setupArgs
  MessagePort | undefined, // MessagePort
];

export type ChildMessageCall = [
  typeof CHILD_MESSAGE_CALL, // type
  boolean, // processed
  string, // method
  Array<unknown>, // args
];

export type ChildMessageEnd = [
  typeof CHILD_MESSAGE_END, // type
  boolean, // processed
];

export type ChildMessage =
  | ChildMessageInitialize
  | ChildMessageCall
  | ChildMessageEnd;

// Messages passed from the children to the parent.

export type ParentMessageCustom = [
  typeof PARENT_MESSAGE_CUSTOM, // type
  unknown, // result
];

export type ParentMessageOk = [
  typeof PARENT_MESSAGE_OK, // type
  unknown, // result
];

export type ParentMessageError = [
  PARENT_MESSAGE_ERROR, // type
  string, // constructor
  string, // message
  string, // stack
  unknown, // extra
];

export type ParentMessage =
  | ParentMessageOk
  | ParentMessageError
  | ParentMessageCustom;

// Queue types.

export type OnStart = (worker: WorkerInterface) => void;
export type OnEnd = (err: Error | null, result: unknown) => void;
export type OnCustomMessage = (message: Array<unknown> | unknown) => void;

export type QueueChildMessage = {
  request: ChildMessageCall;
  onStart: OnStart;
  onEnd: OnEnd;
  onCustomMessage: OnCustomMessage;
};
