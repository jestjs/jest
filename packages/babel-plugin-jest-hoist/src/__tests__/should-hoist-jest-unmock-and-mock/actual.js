import foo from 'foo';
jest.unmock('foo');
jest.mock('bar', () => {});
console.log(foo);
