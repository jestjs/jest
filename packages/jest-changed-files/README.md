# jest-changed-files

A module used internally by Jest to check which files have changed since you
last committed in git or hg.

## Install

```sh
$ npm install --save jest-changed-files
```

## API

### `hg.isHGRepository(cwd: string): Promise<?string>`

Get the root of the mercurial repository containing `cwd` or return `null` if
`cwd` is not inside a mercurial repository.

### `git.isGitRepository(cwd: string): Promise<?string>`

Get the root of the git repository containing `cwd` or return `null` if
`cwd` is not inside a git repository.

### `hg.findChangedFiles / git.findChangedFiles (root: string): Promise<Array<string>>`

Get the list of files in a git/mecurial repository that have changed since the
last commit.

## Usage

```javascript
import {git, hg} from 'jest-changed-files';

function changedFiles(cwd) {
  return Promise.all([
    git.isGitRepository(cwd),
    hg.isHGRepository(cwd),
  ]).then(([gitRoot, hgRoot]) => {
    if (gitRoot !== null) {
      return git.findChangedFiles(gitRoot);
    } else if (hgRoot !== null) {
      return hg.findChangedFiles(hgRoot);
    } else {
      throw new Error('Not in a git or hg repo');
    }
  });
}
```
