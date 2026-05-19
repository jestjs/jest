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
 */
export default async function requireChangelog({github, context}) {
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner: context.repo.owner,
    pull_number: context.issue.number,
    repo: context.repo.repo,
  });
  const filenames = files.map(f => f.filename);
  const needsChangelog =
    filenames.some(f => f.startsWith('packages/')) ||
    filenames.includes('CHANGELOG.md');

  if (needsChangelog) {
    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      labels: ['require-changelog'],
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  } else {
    const hasLabel = context.payload.pull_request.labels.some(
      l => l.name === 'require-changelog',
    );
    if (!hasLabel) return;

    const events = await github.paginate(github.rest.issues.listEvents, {
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
    const lastLabeled = events.findLast(
      e => e.event === 'labeled' && e.label.name === 'require-changelog',
    );
    if (lastLabeled?.actor?.login === 'github-actions[bot]') {
      try {
        await github.rest.issues.removeLabel({
          issue_number: context.issue.number,
          name: 'require-changelog',
          owner: context.repo.owner,
          repo: context.repo.repo,
        });
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
  }
}
