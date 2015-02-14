import Dispatcher from '../Dispatcher'
import Http from '../utils/Http'
import Constants from '../Constants'

var FriendsActions = {

  fetch(opts = {}) {
    Http.get('/api/friends')
    .then(result => Dispatcher.handleServerAction({
      type: Constants.ActionTypes.FETCH_FRIENDS,
      data: result
    }))
    // .fail(err => Dispatcher.handleErrorAction({
    //   type: Constants.ActionTypes.ERROR_FETCH_FRIENDS,
    //   data: err
    // }))
  }
}

export default FriendsActions
