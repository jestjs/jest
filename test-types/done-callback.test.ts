/**
 * @type ./empty.d.ts
 */

import {expectType} from 'tsd';

expectType<void>(
  describe('', () => {
    expectType<void>(
      it('', callback => {
        expectType<jest.DoneCallback>(callback);
        expectType<any>(callback());
        expectType<any>(callback(''));
        expectType<any>(callback('', 3));
        expectType<any>(callback.fail());
        expectType<any>(callback.fail('error'));
        expectType<any>(callback.fail({message: 'message'}));
      }),
    );
  }),
);
