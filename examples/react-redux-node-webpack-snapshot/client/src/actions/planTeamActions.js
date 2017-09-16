import axios from 'axios';

export const GET_TEAM = 'GET_TEAM';

// this does the API call on the backend
export function getTeam() {
  return {
    type: GET_TEAM,
    payload: axios.get('/teamamerica')
      .then((res) => {
        return res.data;
      }),
  };
}
