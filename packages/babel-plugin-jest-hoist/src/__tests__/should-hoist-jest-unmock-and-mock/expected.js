jest.unmock('foo');
jest.mock('bar', () => {});
import foo from 'foo';
console.log(foo);
