import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import promise from 'redux-promise';

// this imports in my React Component
import TeamAmerica from './components/TeamAmerica';

// Redux Store
import store from './reducers/index';

const createStoreWithMiddleware = applyMiddleware(promise)(createStore);

ReactDOM.render(
  <Provider store={createStoreWithMiddleware(store)}>
    <TeamAmerica />
  </Provider>
  , document.getElementById('app') || document.createElement('div'),
);
