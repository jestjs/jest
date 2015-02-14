import React from 'react'
import Immutable from 'immutable'
import FriendsActions from '../actions/FriendsActions'
import FriendsStore from '../stores/FriendsStore'
import FriendsListItem from './FriendsListItem'

var FriendsList = React.createClass({
  // we don't actually need this in this case,
  // it's just to show how you would use Immutable
  // equality checks to improve rendering performance
  shouldComponentUpdate(nextProps, nextState) {
    return !Immutable.is(this.state.friends, nextState.friends)
  },
  getInitialState() {
    return {friends: FriendsStore.getAllFriends()}
  },
  componentWillMount() {
    FriendsActions.fetch()
  },
  componentDidMount() {
    FriendsStore.subscribe(this.onChange)
  },
  componentWillUnmount() {
    FriendsStore.unsubscribe(this.onChange)
  },
  onChange() {
    this.setState(this.getInitialState())
  },
  render() {
    console.log(this.state.friends)
    return (
      <ul>
        {this.state.friends.get('results').toJS()/* not needed in react@0.13 */
          .map(f => <FriendsListItem friend={f} key={f.id} />)}
      </ul>
    )
  }
})

export default FriendsList
