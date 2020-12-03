import {getState} from './state';

export async function withinDeadline<T>(promise: Promise<T>): Promise<T> {
  const deadline = getState()?.currentlyRunningTest?.deadline;
  if (undefined === deadline) {
    throw new Error('bug! no deadline available');
  }
  return timeout(promise, deadline - Date.now());
}

function isUs(line: string): boolean {
  return line.includes('deadlineTimeout') && line.includes('jest-circus');
}

async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      (async () => {
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, ms);
        });
        const here = new Error(`deadline exceeded (waited here for ${ms}ms)`);
        here.stack = here.stack
          ?.split('\n')
          .filter(line => !isUs(line))
          .join('\n');
        throw here;
      })(),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}
