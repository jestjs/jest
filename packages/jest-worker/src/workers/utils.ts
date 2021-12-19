const flatted = require('flatted');

export const stringify = (message: unknown) => {
  return {stringifiedMessage: flatted.stringify(message)};
};

type WorkerResponse = Array<unknown> | [unknown, {stringifiedMessage: string}];

export const parse = ([, re]: WorkerResponse) => {
  if (typeof re === 'object' && re && 'stringifiedMessage' in re) {
    // @ts-expect-error
    return flatted.parse(re.stringifiedMessage);
  }

  return re;
};
