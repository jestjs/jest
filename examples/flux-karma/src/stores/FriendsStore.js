import {EventEmitter} from 'events'
import {Map, List, fromJS} from 'immutable'
import Dispatcher from '../Dispatcher'
import Constants from '../Constants'

var eventEmitter = new EventEmitter()

var store = Map({
  friends: Map({
    count: 0,
    total: 0,
    results: List()
  })
})

var FriendsStore = {
  subscribe(callback) {
    eventEmitter.addListener(Constants.CHANGE_EVENT, callback)
  },
  unsubscribe(callback) {
    eventEmitter.removeListener(Constants.CHANGE_EVENT, callback)
  },
  getAllFriends() {
    return store.get('friends')
  }
}

FriendsStore.dispatchToken = Dispatcher.register(payload => {
  var action = payload.action

  switch(action.type) {
    case Constants.ActionTypes.FETCH_FRIENDS:
      store = store.set('friends', fromJS(action.data))
      eventEmitter.emit(Constants.CHANGE_EVENT)
      break
    case Constants.ActionTypes.ERROR_FETCH_FRIENDS:
      // var error = action.data
      // TODO: handle event error
      break
  }
})

export default FriendsStore
