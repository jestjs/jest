describe('Data driven tests', () => {
  describe('array table', () => {
    describe('.test.each', () => {
      test.each([[0, 0, 0], [1, 1, 2], [5, 10, 15]])(
        'returns result of adding %s to %s',
        (a, b, expected) => {
          expect(a + b).toBe(expected);
        },
      );
    });

    describe('.it.each', () => {
      it.each([[0, 0, 0], [1, 1, 2], [5, 10, 15]])(
        'returns result of adding %s to %s',
        (a, b, expected) => {
          expect(a + b).toBe(expected);
        },
      );
    });

    describe('.describe.each', () => {
      describe.each([[0, 0, 0], [1, 1, 2], [5, 10, 15]])(
        '.add(%s, %s)',
        (a, b, expected) => {
          test(`returns ${expected}`, () => {
            expect(a + b).toBe(expected);
          });
        },
      );
    });
  });

  describe('template literal table', () => {
    describe('.test.each', () => {
      test.each`
        a    | b    | expected
        ${0} | ${0} | ${0}
        ${1} | ${1} | ${2}
        ${5} | ${10} | ${15}
      `('returns $expected when adding $a to $b', ({a, b, expected}) => {
        expect(a + b).toBe(expected);
      });
    });

    describe('.it.each', () => {
      it.each`
        a    | b    | expected
        ${0} | ${0} | ${0}
        ${1} | ${1} | ${2}
        ${5} | ${10} | ${15}
      `('returns $expected when adding $a to $b', ({a, b, expected}) => {
        expect(a + b).toBe(expected);
      });
    });

    describe('.describe.each', () => {
      describe.each`
        a    | b    | expected
        ${0} | ${0} | ${0}
        ${1} | ${1} | ${2}
        ${5} | ${10} | ${15}
      `('.add($a, $b)', ({a, b, expected}) => {
        test(`returns ${expected}`, () => {
          expect(a + b).toBe(expected);
        });
      });
    });
  });
});
