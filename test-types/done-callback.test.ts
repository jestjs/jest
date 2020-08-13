/**
 * @type ./empty.d.ts
 */

import {expectType} from 'tsd';

expectType<void>(
  describe('', () => {
    expectType<void>(
      it('', callback => {
        expectType<jest.DoneCallback>(callback());
        expectType<jest.DoneCallback>(callback(''));
        expectType<jest.DoneCallback>(callback('', 3));
        expectType<jest.DoneCallback>(callback.fail());
        expectType<jest.DoneCallback>(callback.fail('error'));
        expectType<jest.DoneCallback>(callback.fail({message: 'message'}));
      }),
    );
  }),
);
