export const toMilliseconds = ([s, ns]: HRTime): ?number => s * 1e3 + ns / 1e6;
