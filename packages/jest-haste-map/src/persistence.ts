import {Persistence} from './types';

// Try to load SQLite persistence, but fall back to file persistence when SQLite
// is not available.
let chosenModule: Persistence;
try {
  require.resolve('better-sqlite3');
  chosenModule = require('./persistence/sqlite').default;
} catch {
  chosenModule = require('./persistence/file').default;
}

export default chosenModule;
