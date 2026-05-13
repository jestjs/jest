import {page} from '@jest/browser';

(page as any).extend({greet: () => 'hello'});
