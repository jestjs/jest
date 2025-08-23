# jest-leak-detector

Module for verifying whether an object has been garbage collected or not.

Internally creates a weak reference to the object, and forces garbage collection to happen. If the reference is gone, it meant no one else was pointing to the object.

## Example

```javascript
(async function () {
  let reference = {};
  let isLeaking;

  // Second argument is to configure LeakDetector's runtime behavior
  // Currently supports controlling whether to generate V8 heap snapshot, default to be true
  const detector = new LeakDetector(reference, {
    shouldGenerateV8HeapSnapshot: true,
  });

  // Reference is held in memory.
  isLeaking = await detector.isLeaking();
  console.log(isLeaking); // true

  // We destroy the only reference to the object.
  reference = null;

  // Reference is gone.
  isLeaking = await detector.isLeaking();
  console.log(isLeaking); // false
})();
```
