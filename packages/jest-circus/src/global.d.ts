import {State} from './types';
import {STATE_SYM} from './state';

declare module NodeJS {
  interface Global {
    [STATE_SYM]: State;
  }
}
