import {createRequire} from 'module';

const require = createRequire(import.meta.url);
let observedCode;
try {
  require('./eval-time-cycle.mjs');
} catch (error) {
  observedCode = error.code;
}
export const observed = observedCode;
