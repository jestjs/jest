describe("abc", function() {
  it("runs abc", function() {});
});

describe("def", function() {
  beforeAll(() => fail("Ran beforeAll for def"));

  it("does not run def", function() {
    fail("ran def");
  })
});
