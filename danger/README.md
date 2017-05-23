## Why?

As Danger uses jest-runtime we need to separate out node_modules for Danger into it's own folder as conflicts [occurred](https://github.com/facebook/jest/pull/2532).

If you'd like to make changes to the Dangerfile, find an existing PR and copy the URL.

Then run from the Jest root:

```
cd danger
yarn install
..
node danger/node_modules/.bin/danger pr https://github.com/facebook/jest/pull/2642
```

And you will get the responses from parsing the Dangerfile.
