const lodash = jest.genMockFromModule('lodash');

lodash.head = arr => 5;

export default lodash;
