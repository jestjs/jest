/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @param {object} args
 * @param {import('@actions/github').getOctokit} args.github
 * @param {import('@actions/github').context} args.context
 * @param {import('@actions/core')} args.core
 */
export default async function labelChangelog({github, context, core}) {
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner: context.repo.owner,
    pull_number: context.issue.number,
    repo: context.repo.repo,
  });
  const filenames = files.map(f => f.filename);
  const shouldCheck =
    filenames.some(f => f.startsWith('packages/')) ||
    filenames.includes('CHANGELOG.md');

  if (shouldCheck) {
    // Only remove the label if it was added by this bot, not a maintainer
    const events = await github.paginate(github.rest.issues.listEvents, {
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
    const lastLabeled = events.findLast(
      e => e.event === 'labeled' && e.label.name === 'skip-changelog',
    );
    if (lastLabeled?.actor?.login === 'github-actions[bot]') {
      try {
        await github.rest.issues.removeLabel({
          issue_number: context.issue.number,
          name: 'skip-changelog',
          owner: context.repo.owner,
          repo: context.repo.repo,
        });
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
  } else {
    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      labels: ['skip-changelog'],
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  }

  core.setOutput('skip', String(!shouldCheck));
}
