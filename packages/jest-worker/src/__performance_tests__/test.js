'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const workerFarm = require('worker-farm');
const JestWorker = require('../../build');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const calls = 10000;
const threads = 6;

function testWorkerFarm() {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let count = 0;

    async function countToFinish() {
      if (++count === calls) {
        workerFarm.end(api);
        const endTime = Date.now();

        // Let all workers go down.
        await sleep(2000);

        resolve({
          globalTime: endTime - startTime - 2000,
          processingTime: endTime - startProcess,
        });
      }
    }

    const api = workerFarm(
      {
        autoStart: true,
        maxConcurrentCallsPerWorker: 1,
        maxConcurrentWorkers: threads,
      },
      require.resolve('./workers/worker_farm'),
      ['loadTest'],
    );

    // Let all workers come up.
    await sleep(2000);

    const startProcess = Date.now();

    for (let i = 0; i < calls; i++) {
      const promisified = new Promise((resolve, reject) => {
        api.loadTest((err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      promisified.then(countToFinish);
    }
  });
}

function testJestWorker() {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let count = 0;

    async function countToFinish() {
      if (++count === calls) {
        farm.end();
        const endTime = Date.now();

        // Let all workers go down.
        await sleep(2000);

        resolve({
          globalTime: endTime - startTime - 2000,
          processingTime: endTime - startProcess,
        });
      }
    }

    const farm = new JestWorker(require.resolve('./workers/jest_worker'), {
      exposedMethods: ['loadTest'],
      forkOptions: {execArgv: []},
      workers: threads,
    });

    farm.getStdout().pipe(process.stdout);
    farm.getStderr().pipe(process.stderr);

    // Let all workers come up.
    await sleep(2000);

    const startProcess = Date.now();

    for (let i = 0; i < calls; i++) {
      const promisified = farm.loadTest();

      promisified.then(countToFinish);
    }
  });
}

function profile(x) {
  console.profile(x);
}

function profileEnd(x) {
  console.profileEnd(x);
}

async function main() {
  if (!global.gc) {
    console.log('GC not present');
  }

  const wFResults = [];
  const jWResults = [];

  for (let i = 0; i < 10; i++) {
    console.log('-'.repeat(75));

    profile('worker farm');
    const wF = await testWorkerFarm();
    profileEnd('worker farm');
    await sleep(3000);
    // eslint-disable-next-line no-undef
    global.gc && gc();

    profile('jest worker');
    const jW = await testJestWorker();
    profileEnd('jest worker');
    await sleep(3000);
    // eslint-disable-next-line no-undef
    global.gc && gc();

    wFResults.push(wF);
    jWResults.push(jW);

    console.log('jest-worker:', jW);
    console.log('worker-farm:', wF);
  }

  let wFGT = 0;
  let wFPT = 0;
  let jWGT = 0;
  let jWPT = 0;

  for (let i = 0; i < 10; i++) {
    wFGT += wFResults[i].globalTime;
    wFPT += wFResults[i].processingTime;

    jWGT += jWResults[i].globalTime;
    jWPT += jWResults[i].processingTime;
  }

  console.log('-'.repeat(75));
  console.log('total worker-farm:', {wFGT, wFPT});
  console.log('total jest-worker:', {jWGT, jWPT});

  console.log('-'.repeat(75));
  console.log(
    `% improvement over ${calls} calls (global time):`,
    100 * (wFGT - jWGT) / wFGT,
  );

  console.log(
    `% improvement over ${calls} calls (processing time):`,
    100 * (wFPT - jWPT) / wFPT,
  );
}

main();
