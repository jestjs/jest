import {
    expectType,
    expectError
} from 'tsd';

// @ts-expect-error
expectError<void>(describe({}, () => {}))

expectType<void>(describe(0, () => {}));
expectType<void>(describe('name', () => {}));
expectType<void>(describe(() => {}, () => {}));
expectType<void>(describe({ name: 'name' }, () => {}));
