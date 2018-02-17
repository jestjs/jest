# jest-serializer

Module for serializing and deserializing object into memory and disk. By
default, the `v8` implementations are used, but if not present, it defaults to
`JSON` implementation. The V8 serializer has the advantage of being able to
serialize `Map`, `Set`, `undefined`, circular references, etc. It is also a
more compact format to be stored and sent over the wire.

## Install

```sh
$ yarn add jest-serializer
```

## API

Three kinds of API groups are exposed:

### In-memory serialization: `serialize` and `deserialize`

This set of functions take or return a `Buffer`. All the process happens in
memory. This is useful when willing to transfer over HTTP, TCP or via UNIX
pipes.

```javascript
import serializer from 'jest-serializer';

const myObject = {
  foo: 'bar',
  baz: [0, true, '2', [], {}],
};

const buffer = serializer.serialize(myObject);
const myCopyObject = serializer.deserialize(buffer);
```

### Synchronous persistent filesystem: `readFileSync` and `writeFileSync`

This set of functions allow to send to disk a serialization result and retrieve
it back, in a synchronous way. It mimics the `fs` API so it looks familiar.

```javascript
import serializer from 'jest-serializer';

const myObject = {
  foo: 'bar',
  baz: [0, true, '2', [], {}],
};

const myFile = '/tmp/obj';

serializer.writeFileSync(myFile, myObject);
const myCopyObject = serializer.readFileSync(myFile);
```

### Asynchronous persistent filesystem: `readFile` and `writeFile`

Pretty similar to the synchronous one, but providing a callback. It also mimics
the `fs` API.

```javascript
import serializer from 'jest-serializer';

const myObject = {
  foo: 'bar',
  baz: [0, true, '2', [], {}],
};

const myFile = '/tmp/obj';

serializer.writeFile(myFile, myObject, (err) => {
  if (err) {
    console.error(err);
    return;
  }

  serializer.readFile(myFile, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const myCopyObject = data;
  });
});
```
