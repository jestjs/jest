// this is the json for the API to be used on the React frontend
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

module.exports = {
  getTeam: (req, res) => {
    res.send(team);
  },
};
