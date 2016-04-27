/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed in the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

describe('VerboseLogger', () => {
  let groupTestsBySuites;

  beforeEach(() => {
    groupTestsBySuites = require('../VerboseLogger').groupTestsBySuites;
  });

  describe('groupTestsBySuites', () => {

    it('should handle empty results', () => {
      expect(groupTestsBySuites([])).toEqual([]);
    });

    it('should group A1 in A', () => {
      expect(groupTestsBySuites([{
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group A1 in A; B1 in B', () => {
      expect(groupTestsBySuites([{
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'B1',
        ancestorTitles: ['B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }, {
        title: 'B',
        suites: [],
        tests: [{
          ancestorTitles: ['B'],
          title: 'B1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group A1, A2 in A', () => {
      expect(groupTestsBySuites([{
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'A2',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }, {
          ancestorTitles: ['A'],
          title: 'A2',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group A1, A2 in A; B1, B2 in B', () => {
      expect(groupTestsBySuites([{
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'A2',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'B1',
        ancestorTitles: ['B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'B2',
        ancestorTitles: ['B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }, {
          ancestorTitles: ['A'],
          title: 'A2',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }, {
        title: 'B',
        suites: [],
        tests: [{
          ancestorTitles: ['B'],
          title: 'B1',
          failureMessages: [],
          numPassingAsserts: 1,
        }, {
          ancestorTitles: ['B'],
          title: 'B2',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group AB1 in AB', () => {
      expect(groupTestsBySuites([{
        title: 'AB1',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [],
          tests: [{
            ancestorTitles: ['A', 'B'],
            title: 'AB1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [],
      }]);
    });

    it('should group AB1, AB2 in AB', () => {
      expect(groupTestsBySuites([{
        title: 'AB1',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'AB2',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [],
          tests: [{
            ancestorTitles: ['A', 'B'],
            title: 'AB1',
            failureMessages: [],
            numPassingAsserts: 1,
          }, {
            ancestorTitles: ['A', 'B'],
            title: 'AB2',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [],
      }]);
    });

    it('should group A1 in A; AB1 in AB', () => {
      expect(groupTestsBySuites([{
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'AB1',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [],
          tests: [{
            ancestorTitles: ['A', 'B'],
            title: 'AB1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group AB1 in AB; A1 in A', () => {
      expect(groupTestsBySuites([{
        title: 'AB1',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [],
          tests: [{
            ancestorTitles: ['A', 'B'],
            title: 'AB1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

    it('should group AB1 in AB; CD1 in CD', () => {
      expect(groupTestsBySuites([{
        title: 'AB1',
        ancestorTitles: ['A', 'B'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'CD1',
        ancestorTitles: ['C', 'D'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [],
          tests: [{
            ancestorTitles: ['A', 'B'],
            title: 'AB1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [],
      }, {
        title: 'C',
        suites: [{
          title: 'D',
          suites: [],
          tests: [{
            ancestorTitles: ['C', 'D'],
            title: 'CD1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [],
      }]);
    });

    it('should group ABC1 in ABC; BC1 in BC; D1 in D; A1 in A', () => {
      expect(groupTestsBySuites([{
        title: 'ABC1',
        ancestorTitles: ['A', 'B', 'C'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'BC1',
        ancestorTitles: ['B', 'C'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'D1',
        ancestorTitles: ['D'],
        failureMessages: [],
        numPassingAsserts: 1,
      }, {
        title: 'A1',
        ancestorTitles: ['A'],
        failureMessages: [],
        numPassingAsserts: 1,
      }])).toEqual([{
        title: 'A',
        suites: [{
          title: 'B',
          suites: [{
            title: 'C',
            suites: [],
            tests: [{
              ancestorTitles: ['A', 'B', 'C'],
              title: 'ABC1',
              failureMessages: [],
              numPassingAsserts: 1,
            }],
          }],
          tests: [],
        }],
        tests: [{
          ancestorTitles: ['A'],
          title: 'A1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }, {
        title: 'B',
        suites: [{
          title: 'C',
          suites: [],
          tests: [{
            ancestorTitles: ['B', 'C'],
            title: 'BC1',
            failureMessages: [],
            numPassingAsserts: 1,
          }],
        }],
        tests: [],
      }, {
        title: 'D',
        suites: [],
        tests: [{
          ancestorTitles: ['D'],
          title: 'D1',
          failureMessages: [],
          numPassingAsserts: 1,
        }],
      }]);
    });

  });
});
