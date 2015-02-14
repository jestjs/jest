jest.dontMock('../FriendsListItem');
jest.dontMock('../fixture/friends');

import React from 'react/addons';
import FriendsListItem from '../FriendsListItem';
import friendsJson from '../fixture/friends';

var {TestUtils} = React.addons;

describe('FriendsListItem', () => {

  var friend = friendsJson.results[0];
  var item = TestUtils.renderIntoDocument(
    <FriendsListItem friend={friend} key={friend.id} />
  );

  it('should render friend information', () => {
    var info = TestUtils.findRenderedDOMComponentWithClass(item, 'friend-info');
    expect(info.getDOMNode().hasChildNodes('span')).toBe(true);
    expect(info.getDOMNode().children[0].textContent).toEqual(friend.firstName + ' ' + friend.lastName);
    expect(info.getDOMNode().children[1].textContent).toEqual('(age: ' + friend.age + ')');
  });

  it('should render friend image', () => {
    var img = TestUtils.findRenderedDOMComponentWithTag(item, 'img');
    expect(img.getDOMNode().getAttribute('src')).toEqual(friend.picture);
  });
});
