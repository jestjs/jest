// see ES2015 spec 25.4.4.5, https://stackoverflow.com/a/38339199
const isPromise = (candidate: unknown): candidate is Promise<unknown> =>
  Promise.resolve(candidate) === candidate;
export default isPromise;
