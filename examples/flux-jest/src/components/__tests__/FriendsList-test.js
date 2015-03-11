jest.dontMock('../FriendsList');
jest.dontMock('../FriendsListItem');
jest.dontMock('../fixture/friends');

import Immutable from 'immutable';
import friendsJson from '../fixture/friends';

describe('FriendsList', () => {

  let React, TestUtils, FriendsList;

  beforeEach(() => {
    // FIXME: apparently Jest or React has a problem when
    // requiring `react/addons` as two version of React
    // are being loaded alongside.
    // The workaround is to require React before each test.
    // https://groups.google.com/d/msg/reactjs/zyZDhXvaqs4/e-PyEOyzvt0J
    React = require('react/addons');
    TestUtils = React.addons.TestUtils;

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
