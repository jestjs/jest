---
id: version-22.3-mongodb
title: Using with MongoDB
original_id: mongodb
---

With the [Global Setup/Teardown](Configuration.md#globalsetup-string) and [Async Test Environment](Configuration.md#testenvironment-string) APIs, Jest can work smoothly with [MongoDB](https://www.mongodb.com/).

## A jest-mongodb example

The basic idea is to:

1.  Spin up in-memory mongodb server
2.  Export a global variable with mongo URI
3.  Write tests for queries / aggregations using a real database ✨
4.  Shut down mongodb server using Global Teardown

Here's an example of the GlobalSetup script

```js
// setup.js
const MongodbMemoryServer = require('mongodb-memory-server');

const MONGO_DB_NAME = 'jest';
const mongod = new MongodbMemoryServer.default({
  instance: {
    dbName: MONGO_DB_NAME,
  },
  binary: {
    version: '3.2.19',
  },
});

module.exports = function() {
  global.__MONGOD__ = mongod;
  global.__MONGO_DB_NAME__ = MONGO_DB_NAME;
};
```

Then we need a custom Test Environment for Mongo

```js
// mongo-environment.js
class MongoEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    console.log('Setup MongoDB Test Environment');

    this.global.__MONGO_URI__ = await global.__MONGOD__.getConnectionString();
    this.global.__MONGO_DB_NAME__ = global.__MONGO_DB_NAME__;

    await super.setup();
  }

  async teardown() {
    console.log('Teardown MongoDB Test Environment');

    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}
```

Finally we can shut down mongodb server

```js
// teardown.js
module.exports = async function() {
  await global.__MONGOD__.stop();
};
```

With all the things set up, we can now write our tests like this:

```js
// test.js
const {MongoClient} = require('mongodb');

let connection;
let db;

beforeAll(async () => {
  connection = await MongoClient.connect(global.__MONGO_URI__);
  db = await connection.db(global.__MONGO_DB_NAME__);
});

afterAll(async () => {
  await connection.close();
  await db.close();
});

it('should aggregate docs from collection', async () => {
  const files = db.collection('files');

  await files.insertMany([
    {type: 'Document'},
    {type: 'Video'},
    {type: 'Image'},
    {type: 'Document'},
    {type: 'Image'},
    {type: 'Document'},
  ]);

  const topFiles = await files
    .aggregate([
      {$group: {_id: '$type', count: {$sum: 1}}},
      {$sort: {count: -1}},
    ])
    .toArray();

  expect(topFiles).toEqual([
    {_id: 'Document', count: 3},
    {_id: 'Image', count: 2},
    {_id: 'Video', count: 1},
  ]);
});
```

Here's the code of [full working example](https://github.com/vladgolubev/jest-mongodb).
