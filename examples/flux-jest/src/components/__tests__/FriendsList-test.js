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
      getAllFriends() {
        // here we just return the list of friends
        // as if the data was fetched from the server
        return Immutable.fromJS(friendsJson);
      },
      subscribe() {},
      unsubscribe() {}
    });
    FriendsList = require('../FriendsList');
  });

  xit('should render list of items', () => {
    var list = TestUtils.renderIntoDocument(
      <FriendsList />
    );

    var items = TestUtils.scryRenderedDOMComponentsWithTag(list, 'li');
    expect(items.length).toBe(friendsJson.results.length);
  });
});
