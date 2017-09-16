import React from 'react';
import renderer from 'react-test-renderer';
import { TeamAmerica } from './../../client/src/components/TeamAmerica';

// I had to copy paste the API json into this file to fix a bug
const team = {
  presidents: [
    {
      team: 'Presidents',
      team_id: '1',
      first_name: 'George',
      full_name: 'George Washington',
      last_name: 'Washington',
      role: 'First President of the United State of America.',
    },
    {
      team: 'Presidents',
      team_id: '2',
      first_name: 'Abraham',
      full_name: 'Abraham Lincoln',
      last_name: 'Lincoln',
      role: 'President during the Civil War.',
    },
    {
      team: 'Presidents',
      team_id: '3',
      first_name: 'Franklin D.',
      full_name: 'Franklin D. Roosevelt',
      last_name: 'Roosevelt',
      role: 'President during The Great Depression and WW2. Only president to be elected 4 times.',
    },
  ],
  client: [
    {
      team: 'US People',
      team_id: '2',
      first_name: 'Joe',
      full_name: 'Joe Sixpack',
      last_name: 'Sixpack',
      role: 'Average American',
    },
  ],
};

// I was getting an error that getTeam was not a function, so I had to turn it into a function in the test by doing this fat arrow
const getTeam = () => {};

// This is the actual test written for Jest
it('test to see if the team renders correctly', () => {
  const tree = renderer
  .create(<TeamAmerica getTeam={getTeam} team={[team.presidents]} />)
  .toJSON();
  expect(tree).toMatchSnapshot();
});

