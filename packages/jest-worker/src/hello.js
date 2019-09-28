const { default: Worker } = require('jest-worker');


const myWorker = new Worker(require.resolve('./__performance_tests__/workers/pi.js'), {
    numWorkers: 4,
    enableWorkerThreads: true
  });

const promise = myWorker.default();

promise.onCustomMessage((message) => {
    console.log(message)
})
promise.then(console.log).then(() => process.exit())