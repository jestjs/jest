/**
 * @type ./empty.d.ts
 */

import {expectType} from 'tsd';
import {describe, it} from '@jest/globals';
// import type {DoneFn} from '@jest/types/src/Global';

expectType<void>(
  describe('', () => {
    expectType<void>(
      it('', _ => {
        // FIXME: callback cannot be invoked. Has undefined type in it.
        // expectType<DoneFn | undefined>(callback());
        // expectType<DoneFn | undefined>(callback(''));
        // expectType<DoneFn | undefined>(callback('', 3));
        // expectType<DoneFn | undefined>(callback.fail());
        // expectType<DoneFn | undefined>(callback.fail('error'));
        // expectType<DoneFn | undefined>(callback.fail({message: 'message'}));
      }),
    );
  }),
);
