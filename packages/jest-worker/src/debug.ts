import * as process from 'process';

export const debug = process.env.DEBUG_JEST_WORKER
  ? (msg: string) => console.log(`jest-worker: ${msg}`)
  : (_msg: string) => {};
