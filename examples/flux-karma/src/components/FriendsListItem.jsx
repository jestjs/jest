import React from 'react'

var FriendInfo = React.createClass({
  render() {
    return (
      <div className="friend-info">
        <span>{this.props.firstName} {this.props.lastName}</span>
        <span>(age: {this.props.age})</span>
      </div>
    )
  }
})

var FriendsListItem = React.createClass({
  render() {
    return (
      <li>
        <div>
          <img src={this.props.friend.picture} />
        </div>
        <FriendInfo
          firstName={this.props.friend.firstName}
          lastName={this.props.friend.lastName}
          age={this.props.friend.age} />
      </li>
    )
  }
})

export default FriendsListItem
