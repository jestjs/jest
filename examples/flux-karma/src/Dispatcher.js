import {Dispatcher} from 'flux'
import assign from 'object-assign'
import Constants from './Constants'

var AppDispatcher = assign(new Dispatcher(), {

  handleServerAction(action) {
    this.dispatch({
      source: Constants.Payload.SERVER_ACTION,
      action: action
    })
  },

  handleViewAction(action) {
    this.dispatch({
      source: Constants.Payload.VIEW_ACTION,
      action: action
    })
  },

  handleErrorAction(action) {
    this.dispatch({
      source: Constants.Payload.ERROR_ACTION,
      action: action
    })
  },

})

export default AppDispatcher
