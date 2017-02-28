import {
  recursive,
  loop,
} from '../Fibonacci';

benchmark('fastest Fibonacci implementation', () => {
  let amount;
  beforeEach(() => {
    amount = 10;
  });
  scenario('looping (10 times)', () => {
    loop(amount);
  });
  scenario('recursive (10 times)', () => {
    recursive(amount);
  });
});

