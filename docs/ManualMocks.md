---
id: manual-mocks
title: Manual mocks
layout: docs
category: Reference
permalink: docs/manual-mocks.html
next: timer-mocks
---

Although autogeneration of mocks is convenient, there are behaviors it misses,
such as [fluent interfaces](http://martinfowler.com/bliki/FluentInterface.html).
Furthermore, providing useful helpers on mock versions of a module, especially a
core module, promotes reuse and can help to hide implementation details.

Manual mocks are defined by writing a module in a `__mocks__/` subdirectory
immediately adjacent to the module. For example, to mock a module called
``user`` in a the ``models`` directory, create a file called ``user.js`` and
put it in the ``models/__mocks__`` directory. If the module you are mocking is
a node module, the mock should be placed in the same parent directory as the
``node_modules`` folder. Eg:

```
  node_modules
  __mocks__
  __tests__
  views
  config
```

When a manual mock exists for a given module, Jest's module system will just
use that instead of trying to automatically generate a mock.

Assuming that the module can be loaded by the automocker, it's best to build on
the automocked API. This makes it harder for mock APIs to get out of sync with
real ones.

Here's a contrived example where we have a module that provides a summary of
all the files in a given directory.

```javascript
// FileSummarizer.js
'use strict';

const fs = require('fs');

function summarizeFilesInDirectorySync(directory) {
  return fs.readdirSync(directory).map(fileName => ({
    fileName,
    directory,
  }));
}

exports.summarizeFilesInDirectorySync = summarizeFilesInDirectorySync;
```

Since we'd like our tests to avoid actually hitting the disk (that's pretty
slow and fragile), we create a manual mock for the `fs` module by extending the
automatic mock. Our manual mock will implement custom versions of the `fs` APIs
that we can build on for our tests:

```javascript
// __mocks__/fs.js
'use strict';

const path = require('path');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}

// A custom version of `readdirSync` that reads from the special mocked out
// file list set via __setMockFiles
function readdirSync(directoryPath) {
  return mockFiles[directoryPath] || [];
}

exports.__setMockFiles = __setMockFiles;
exports.readdirSync = readdirSync;
```

Now we write our test:

```javascript
// __tests__/FileSummarizer-test.js
'use strict';

jest.mock('fs');
jest.unmock('../FileSummarizer');

describe('FileSummarizer', () => {
  describe('listFilesInDirectorySync', () => {
    const MOCK_FILE_INFO = {
      '/path/to/file1.js': 'console.log("file1 contents");',
      '/path/to/file2.txt': 'file2 contents',
    };

    beforeEach(() => {
      // Set up some mocked out file info before each test
      require('fs').__setMockFiles(MOCK_FILE_INFO);
    });

    it('includes all files in the directory in the summary', () => {
      const FileSummarizer = require('../FileSummarizer');
      const fileSummary = FileSummarizer.summarizeFilesInDirectorySync(
        '/path/to'
      );

      expect(fileSummary.length).toBe(2);
    });
  });
});
```

As you can see, it's sometimes useful to do more than what the automatic mocker
is capable of doing for us.

The example mock shown here uses [`jest.genMockFromModule`](/jest/docs/api.html#jest-genmockfrommodule-modulename)
to generate an automatic mock, and overrides its default behavior. This is the
recommended approach, but is completely optional. If you do not want to use the
automatic mock at all, you can simply export your own functions from the mock
file. Of course, one downside to fully manual mocks is that they're manual –
meaning you have to manually update them any time the module they are mocking
changes. Because of this, it's best to use or extend the automatic mock when it
works for your needs.

The code for this example is available at
[examples/manual_mocks](https://github.com/facebook/jest/tree/master/examples/manual_mocks).


Testing manual mocks
-------------

It's generally an anti-pattern to implement an elaborate, stateful mock for a
module. Before going down this route, consider covering the real module
completely with tests and then whitelisting it with
[`config.unmockedModulePathPatterns`](/jest/docs/api.html#config-unmockedmodulepathpatterns-array-string),
so that any tests that `require()` it will always get the real implementation
(rather than a complicated mock version). Of course, this does not work in some
scenarios, such as when disk or network access is involved.

In cases where this kind of elaborate mock is unavoidable, it's not necessarily
a bad idea to write a test that ensures that the mock and the actual
implementation are in sync. Luckily, this is relatively easy to do with the API
provided by `jest`, which allows you to explicitly require both the real module
(using `require.requireActual()`) and the manually mocked implementation of the
module (using `require()`) in a single test!
