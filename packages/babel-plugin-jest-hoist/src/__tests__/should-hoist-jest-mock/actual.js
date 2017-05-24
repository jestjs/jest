import foo from 'foo';
jest.mock('bar', () => {});
console.log(foo);
