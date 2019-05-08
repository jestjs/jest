import fs from 'fs';
import v8 from 'v8';
import os from 'os';
import serialize from 'pretty-format';
import sqlitePersistence from '../../persistence/sqlite';
import {InternalHasteMap} from '../../types';

const mockData = v8.deserialize(
  fs.readFileSync(__dirname + '/mock-data.v8'),
) as InternalHasteMap;
const tmpDb = os.tmpdir() + '/sqlite-test-' + Date.now();

it('write(original) -> read() === original', () => {
  sqlitePersistence.write(tmpDb, mockData, new Map());
  const revivedData = sqlitePersistence.read(tmpDb);
  expect(serialize(revivedData)).toEqual(serialize(mockData));
});
