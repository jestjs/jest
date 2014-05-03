The test framework is built on node and the test scripts are running in an environment which has some redefined global objects and special mocked modules.

Event
-----

Event is an extended global object and an internal standard way for a DOM element to listen to keyboard/mouse/loading/unloading events. Since the test framework is running in Node.js instead of a real browser, the ability to fire such event from code is required. `Event.mockFire` is provided to make it easier to simulate user input that surfaces as a DOM event.

```javascript
var Button = require('Button');
// Assume Button.root is a dom listen to 'click' event, to fire the event:
Event.mockFire(Button.root, 'click', {});
```

Timers
------

The native timer functions, i.e., `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` are not suitable for the test environment since they depend on real time to elapse. Fake timer functions are provided to make assertions about behaviors with respect to these timers.

```javascript
// Assume module 'PlayerGames' called
//   setTimeout(callback, 1000);
require('PlayGames');
expect(setTimeout.mock.calls.length).toEqual(1);
expect(setTimeout.mock.calls[0][1]).toEqual(1000);
```

Further, it provides you the ability to make fake time elapse in your code:
```javascript
// This will run the timer callbacks within the next 2000 milliseconds 
// iteratively. Note: 2000 is specifying a relative time from 'now' 
// instead of from the time test start running
mockRunTimersToTime(2000);
// Assert the result of callback()
```

Or if the time elapse is not really important, you just need to run the timer callbacks once:
```javascript
// Every timer function callback will be executed once
mockRunTimersOnce();
```

Or if you may have timers that may register other timers and don't want to manage the number of times to run or choose an arbitrary large length of time to run, you can run timers repeatedly:
```javascript
// Every timer function callback will be executed in time order until there
// are no more.
mockRunTimersRepeatedly();
```

To clear all timers:
```javascript
mockClearTimers();
```

To get current timers count:
```javascript
expect(mockGetTimersCount()).toEqual(4);
```
