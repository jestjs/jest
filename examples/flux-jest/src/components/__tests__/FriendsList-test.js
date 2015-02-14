jest.dontMock('../FriendsList');
jest.dontMock('../fixture/friends');

import React from 'react/addons';
import Immutable from 'immutable';
import friendsJson from '../fixture/friends';

var {TestUtils} = React.addons;

describe('FriendsList', () => {

  let FriendsList;

  beforeEach(() => {
    // we have to do some manual mocking
    jest.setMock('../../actions/FriendsActions', {
      fetch() {}
    });
    jest.setMock('../../stores/FriendsStore', {
      // here we just return the list of friends
      // as if the data was fetched from the server
      getAllFriends() {
        // FIXME: https://github.com/facebook/jest/issues/228
        var j = JSON.parse(JSON.stringify(friendsJson));
        return Immutable.fromJS(j);
      },
      subscribe() {},
      unsubscribe() {}
    });
    FriendsList = require('../FriendsList');
  });

  it('should render list of items', () => {
    var list = TestUtils.renderIntoDocument(
      <FriendsList />
    );

    var items = TestUtils.scryRenderedDOMComponentsWithTag(list, 'li');
    expect(items.length).toBe(friendsJson.results.length);
  });
});
