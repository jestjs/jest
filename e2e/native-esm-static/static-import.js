import inc from '../native-esm/stateful.mjs';

export default class DefaultCalculator {
  inc() {
    return inc();
  }
}

export class NegativeCalculator {
  dec() {
    return -inc();
  }
}
