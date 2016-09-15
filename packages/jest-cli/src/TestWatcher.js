'use strict';

type TestWatcherState = {
  interrupted: boolean,
};

class TestWatcher {
  state: TestWatcherState;
  listeners: Array<func>;

  constructor() {
    this.state = {interrupted: false};
    this.listeners = [];
  }

  setState(val: any): void {
    this.state = Object.assign({}, this.state, val);

    for (let i = 0; i < this.listeners.length; i++) {
      const listener = this.listeners[i];
      listener();
    }
  }

  isInterrupted(): boolean {
    return this.state.interrupted;
  }

  subscribe(listener: void) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    let isSubscribed = true;
    const listeners = this.listeners;

    listeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }
}

module.exports = TestWatcher;
