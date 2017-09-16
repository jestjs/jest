import { combineReducers } from 'redux';

// Reducers
import PlanTeam from './reducer_plan_team';

const rootReducer = combineReducers({
  planTeam: PlanTeam,
});

export default rootReducer;
