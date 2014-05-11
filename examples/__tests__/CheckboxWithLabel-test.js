jest
  .dontMock('ReactTestUtils')
  .dontMock('../CheckboxWithLabel.js');

describe('CheckboxWithLabel', function() {
  it('changes the text after click', function() {
    var CheckboxWithLabel = require('../CheckboxWithLabel.js');
    var ReactTestUtils = require('ReactTestUtils');
    console.log('fu');
  });
});
