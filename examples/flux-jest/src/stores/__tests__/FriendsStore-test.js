jest.dontMock('events')
jest.dontMock('object-assign')
jest.dontMock('../FriendsStore')

const actionFetchFriends = {
  source: 'server-action',
  action: {
    type: 'fetch-friends',
    data: {
      count: 1,
      total: 1,
      results: [{foo: 'bar'}]
    }
  }
}

describe('FriendsStore', () => {
  let Dispatcher, FriendsStore, callback

  beforeEach(() => {
    Dispatcher = require('../../Dispatcher')
    FriendsStore = require('../FriendsStore')
    callback = Dispatcher.register.mock.calls[0][0]
  })

  it('should register a callback with the dispatcher', () => {
    expect(Dispatcher.register.mock.calls.length).toBe(1)
  })

  it('should initialize with default data', () => {
    var friends = FriendsStore.getAllFriends()
    expect(friends.toJS()).toEqual({
      count: 0,
      total: 0,
      results: []
    })
  })

  it('should populate store with fetched data', () => {
    callback(actionFetchFriends)
    var friends = FriendsStore.getAllFriends()
    expect(friends.toJS()).toEqual(actionFetchFriends.action.data)
  })

  it('should subscribe to updates', () => {
    var callMe = jest.genMockFunction()

    // subscribe to change events with our mocked fn
    FriendsStore.subscribe(callMe)
    // first call
    callback(actionFetchFriends)
    expect(callMe.mock.calls.length).toBe(1)
    // second call
    callback(actionFetchFriends)
    expect(callMe.mock.calls.length).toBe(2)

    // when we unsubscribe, there should not be any more calls
    FriendsStore.unsubscribe(callMe)
    callback(actionFetchFriends)
    expect(callMe.mock.calls.length).toBe(2)
  })
})
