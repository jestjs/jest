const add = require('../add');

describe('Custom Reporters', () => {
    test('adds ok', () => {
        expect(add(1, 2)).toBe(3);
        expect(add(3, 4)).toBe(7);
        expect(add(12, 24)).toBe(36);
    });
});
