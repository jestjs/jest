---
id: firestore
title: Using with Firestore
---

With Jest's [Global Setup/Teardown](Configuration.md#globalsetup-string) and [Async Test Environment](Configuration.md#testenvironment-string) APIs, the developer experience for [Firestore](https://firebase.google.com/docs/firestore) is improved compared to using the `firebase emulators:exec` command.

## Use jest-firestore Preset

[Jest Firestore](https://github.com/thekip/jest-firestore) provides all required configuration to run your tests using Firestore Emulator.

1.  First install `@thekip/jest-firestore`

```bash npm2yarn
npm install --save-dev @thekip/jest-firestore
```

2.  Specify preset in your Jest configuration:

```json
{
  "preset": "jest-firestore"
}
```

3.  Write your test

```ts
import {type Firestore, getFirestore} from 'firebase-admin/firestore';
import {initializeApp} from 'firebase-admin/app';

describe('insert', () => {
  let firestore: Firestore;
  // setup deffiernet database for each jest worker to enable parallelism
  const databaseName = `test-${process.pid}`;

  beforeAll(() => {
    // `firebase-admin` automatically discover
    // FIRESTORE_EMULATOR_HOST provided by jest-firestore
    const app = initializeApp();
    firestore = getFirestore(app, databaseName);
  });

  beforeEach(async () => {
    // clear database before each test
    await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${process.env.GCLOUD_PROJECT}/databases/${databaseName}/documents`,
      {method: 'DELETE'},
    );
  });

  it('should insert a doc into collection', async () => {
    const users = firestore.collection('users');

    const mockUser = {_id: 'some-user-id', name: 'John'};
    const {id} = await users.add(mockUser);

    const insertedUser = await users.doc(id).get();

    expect(insertedUser.data()).toEqual(mockUser);
  });
});
```

There's no need to load any dependencies.

See [documentation](https://github.com/thekip/jest-firestore) for details.
