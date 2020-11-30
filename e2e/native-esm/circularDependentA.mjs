import circularDependentB from './circularDependentB.mjs';

export default {
    id: 'circularDependentA',
    get moduleB() {
        return circularDependentB;
    }
};
