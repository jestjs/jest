const DEFAULT_STATE = {
  team: [],
};

const projects = [];

const getTeam = (state, action) => {
  const newState = {};

  projects.push(action.payload.presidents);
  projects.push(action.payload.client);

  Object.assign(newState, state, { team: projects });

  return newState;
};

export default function (state = DEFAULT_STATE, action) {
  switch (action.type) {
    case 'GET_TEAM':
      return getTeam(state, action);
    default:
      return state;
  }
}
