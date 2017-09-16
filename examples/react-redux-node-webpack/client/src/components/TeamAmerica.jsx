import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

// Actions being imported
import { getTeam } from '../actions/planTeamActions';

// This is my React class that has the basic code to get my example to render
// I had to export the class like this so Jest could read it
export class TeamAmerica extends Component {
  componentDidMount() {
    this.props.getTeam();
  }

  renderTeam() {
    const team = this.props.team;

    if (team.length === 0) {
      return (
        <div>
          <img alt="loading" src={require('../../stylesheets/preloader.gif')} />
        </div>
      );
    }
    return team.map((teams) => {
      return (
        <div>
          <h2>{teams.map((member, i) => {
            return (
              <div>{i === 0 ? member.team : undefined}</div>
            );
          })}</h2>
          {teams.map((member) => {
            return (
              <ul>
                <li>
                  {member.full_name}&nbsp;-&nbsp;
                  {member.role}&nbsp;
                </li>
              </ul>
            );
          })}
        </div>
      );
    });
  }

  render() {
    return (
      <div>
        <h1>Team America</h1>
        {this.renderTeam()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    team: state.planTeam.team,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ getTeam }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TeamAmerica);
