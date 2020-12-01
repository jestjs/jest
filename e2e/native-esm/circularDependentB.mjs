import circularDependentA from './circularDependentA.mjs';

export default {
  id: 'circularDependentB',
  get moduleA() {
    return circularDependentA;
  },
};
