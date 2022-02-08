---
id: mongodb
title: Using with MongoDB
---

With the [Global Setup/Teardown](Configuration.md#globalsetup-string) and [Async Test Environment](Configuration.md#testenvironment-string) APIs, Jest can work smoothly with [MongoDB](https://www.mongodb.com/).

## Use jest-mongodb Preset

[Jest MongoDB](https://github.com/shelfio/jest-mongodb) provides all required configuration to run your tests using MongoDB.

1.  First install `@shelf/jest-mongodb`

```
yarn add @shelf/jest-mongodb --dev
```

2.  Specify preset in your Jest configuration:

```json
{
  "preset": "@shelf/jest-mongodb"
}
```

3.  Write your test

```js
const {MongoClient} = require('mongodb');

describe('insert', () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true,
    });
    db = await connection.db(global.__MONGO_DB_NAME__);
  });

  afterAll(async () => {
    await connection.close();
    await db.close();
  });

  it('should insert a doc into collection', async () => {
    const users = db.collection('users');

    const mockUser = {_id: 'some-user-id', name: 'John'};
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({_id: 'some-user-id'});
    expect(insertedUser).toEqual(mockUser);
  });
});
```

If you are using multiple test files with many tests, you might want to consider using the following parameter:

```
jest --runInBand
```

This parameter will make sure your tests won't run in parallel, which could cause issues with data being deleted from collections while you are accessing them.

There's no need to load any dependencies.

See [documentation](https://github.com/shelfio/jest-mongodb) for details (configuring MongoDB version, etc).
