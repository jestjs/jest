# jest-node

Package for simple jest call from node script.

## Basic example

```
const jestNode = require('jest-node');

// see 'GlobalConfig' type for details
const options = {  
  testPathPattern: 'file',
  testNamePattern: 'name',
};
// list of project directories to test
const projects = [__dirname];

jestNode(options, projects)
  .then(results => {
    // test completed - see results object for tests status
  })
  .catch(error => {
    // error preventing jest to complete test
  });
```

