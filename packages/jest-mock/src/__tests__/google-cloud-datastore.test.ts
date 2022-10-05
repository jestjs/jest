import {Datastore} from '@google-cloud/datastore';
jest.mock('@google-cloud/datastore');
const mockedDataStore = jest.mocked(Datastore);

describe('google cloud datastore tests', () => {
  it('can mock a google cloud datastore', async () => {
    const ds = new Datastore();
    const task = {
      data: {
        description: 'Test description',
      },
      key: ds.key(['Task', 'testTask']),
    };
    await ds.save(task);
    expect(mockedDataStore.prototype.save).toBeCalledTimes(1);
    expect(mockedDataStore.prototype.save).toBeCalledWith(task);
  });
});
