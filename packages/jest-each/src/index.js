import arrayEach from './array';
import templateEach from './template';

const each = (...args) => {
  if (args.length > 1) {
    return templateEach(global)(...args);
  }

  return arrayEach(global)(...args);
};

each.withGlobal = g => (...args) => {
  if (args.length > 1) {
    return templateEach(g)(...args);
  }

  return arrayEach(g)(...args);
};

export default each;
