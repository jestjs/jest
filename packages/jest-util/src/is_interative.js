import isCI from 'is-ci';

export default process.stdout.isTTY && !isCI;
