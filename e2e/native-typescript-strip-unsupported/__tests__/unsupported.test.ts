enum Direction {
  Up,
}

test('never runs', () => {
  expect(Direction.Up).toBe(0);
});
