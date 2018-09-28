export default class ErrorWithStack extends Error {
  constructor(message, callsite) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, callsite);
    }
  }
}
