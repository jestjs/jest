/* eslint-disable */

'use strict';

require(`shelljs/global`);

const GIT_USER = process.env.GIT_USER;
const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH;
const CIRCLE_PROJECT_USERNAME = process.env.CIRCLE_PROJECT_USERNAME;
const CIRCLE_PROJECT_REPONAME = process.env.CIRCLE_PROJECT_REPONAME;
const CI_PULL_REQUEST = process.env.CI_PULL_REQUEST;
const remoteBranch = `https://${GIT_USER}@github.com/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}.git`;

if (!which(`git`)) {
  echo(`Sorry, this script requires git`);
  exit(1);
}

if (CI_PULL_REQUEST || CIRCLE_BRANCH !== `master` || CIRCLE_PROJECT_USERNAME !== `facebook`) {
  echo(`Skipping deploy`);
  exit(0);
}

echo(`Building branch ${CIRCLE_BRANCH}, preparing to push to gh-pages`);

// Clear out existing build folder
rm(`-rf`, `build`);
mkdir(`-p`, `build`);

// Build site here
cd(`build`);

if (exec(`git clone ${remoteBranch} ${CIRCLE_PROJECT_REPONAME}-gh-pages`).code !== 0) {
  echo(`Error: Git clone failed`);
  exit(1);
}

cd(`${CIRCLE_PROJECT_REPONAME}-gh-pages`);

if (exec(`git checkout origin/gh-pages`).code +
    exec(`git checkout -b gh-pages`).code +
    exec(`git branch --set-upstream-to=origin/gh-pages`).code !== 0
    ) {
  echo(`Error: Git checkout gh-pages failed`);
  exit(1);
}

cd(`../..`);

if (exec(`node server/generate.js`).code) {
  echo(`Error: Generating HTML failed`);
  exit(1);
}

cp(`-R`, `build/${CIRCLE_PROJECT_REPONAME}/*`, `build/${CIRCLE_PROJECT_REPONAME}-gh-pages/`);
cd(`build/${CIRCLE_PROJECT_REPONAME}-gh-pages`);

exec(`git add --all`);
exec(`git commit -m "update website"`);
if (exec(`git push origin gh-pages`).code !== 0) {
  echo(`Error: Git push failed`);
  exit(1);
} else {
  echo(`Website is live at: https://${CIRCLE_PROJECT_USERNAME}.github.io/${CIRCLE_PROJECT_REPONAME}/`);
  exit(0);
}
