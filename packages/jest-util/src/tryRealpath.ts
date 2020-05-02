import {realpathSync} from 'graceful-fs';
import type {Config} from '@jest/types';

export default function tryRealpath(path: Config.Path): Config.Path {
  try {
    path = realpathSync.native(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return path;
}
