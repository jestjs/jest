# jest-leak-detector

Module for verifying whether an object has been garbage collected or not.

Internally uses a `WeakSet`, and natively detectors its size after forcing the garbage collector to run. If the size went down to zero, it means no additional references are held by the code.

## Example

```javascript
let reference = {};

const detector = new LeakDetector(reference);

// Reference is held in memory.
console.log(detector.isLeaked()); // true

// We destroy the only reference to the object.
reference = null;

// Reference is gone.
console.log(detector.isLeaked()); // false
```
