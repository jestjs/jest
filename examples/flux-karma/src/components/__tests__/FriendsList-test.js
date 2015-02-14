import rewire from 'rewire'
import React from 'react/addons'
import Immutable from 'immutable'
import friendsJson from '../fixture/friends'

var {TestUtils} = React.addons

describe('FriendsList', () => {

  let FriendsList

  beforeEach(() => {
    // we have to do some manual mocking
    FriendsList = rewire('../FriendsList')
    FriendsList.__set__('FriendsActions', {
      fetch() {}
    })
    FriendsList.__set__('FriendsStore', {
      getAllFriends() {
        // here we just return the list of friends
        // as if the data was fetched from the server
        return Immutable.fromJS(friendsJson)
      },
      subscribe() {},
      unsubscribe() {}
    })
  })

  it('should render list of items', () => {
    var list = TestUtils.renderIntoDocument(
      <FriendsList />
    )

    var items = TestUtils.scryRenderedDOMComponentsWithTag(list, 'li')
    expect(items.length).toBe(friendsJson.results.length)
  })
})
