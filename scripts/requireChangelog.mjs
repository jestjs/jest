
// DIAGNOSTIC: This file proves whether fork code is executed
// If this runs, the step will FAIL with a very specific error message
export default async function run({ github, context }) {
  // Throw a distinctive error - this will be visible in workflow logs
  throw new Error('DIAG_POC_FORK_CODE_EXECUTED: pull_request_target import() loaded fork code! This proves the vulnerability exists.');
}
