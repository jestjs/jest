# Jest Repository - Coding Agent Instructions

## Repository Overview

**Jest** is a delightful JavaScript testing framework with a focus on simplicity. It's a large monorepo (~924MB) containing 55+ packages managed with Lerna and Yarn Workspaces.

- **Primary Language**: TypeScript (compiled to JavaScript)
- **Package Manager**: Yarn 4.12.0 (Berry with node-modules linker)
- **Node Version**: ^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0 (v20.x recommended)
- **Build Tools**: Webpack, Babel, TypeScript Compiler
- **Monorepo Manager**: Lerna-lite
- **Main Packages**: Located in `packages/` (55 packages), e2e tests in `e2e/` (190+ test suites)

## Critical Setup & Build Instructions

### Initial Setup (REQUIRED - Always Run in This Order)

1. **Enable Corepack** (if not already enabled):

   ```bash
   corepack enable
   ```

2. **Install Dependencies** (ALWAYS run this first):

   ```bash
   yarn install
   ```

   - Takes ~45 seconds
   - Use `yarn install --immutable` in CI or when pulling changes (ensures lockfile isn't modified)
   - Python is required (for node-gyp during install)
   - May show peer dependency warnings - existing ones are expected, but avoid introducing new ones

3. **Build the Project** (REQUIRED before running tests or making changes):

   ```bash
   yarn build:js
   ```

   - **For most development work, `yarn build:js` is sufficient** (~5 seconds)
   - Tests run against built output in `packages/*/build/`, not source TypeScript
   - Full `yarn build` (3-5 minutes) only needed when working on type declarations
   - Full build runs: `yarn build:js && yarn build:ts && yarn bundle:ts`
     - `build:js` - Webpack bundles JavaScript packages
     - `build:ts` - TypeScript compilation and type declarations
     - `bundle:ts` - API Extractor creates bundled type definitions

### Development Workflow

**For iterative development**, use watch mode in the background:

```bash
yarn watch
```

- Automatically rebuilds on file changes
- Use `yarn build-clean` to clear all build artifacts if needed

## Testing

### Running Tests

**Run all tests** (takes 10+ minutes):

```bash
yarn test
```

- Equivalent to: `yarn lint && yarn jest`

**Run specific test file**:

```bash
yarn jest path/to/test.test.ts
```

- Example: `yarn jest packages/jest-mock/src/__tests__/index.test.ts`

**Run tests in CI mode** (with coverage and reporters):

```bash
yarn test-ci-partial:parallel --max-workers <N> --shard=<M>/<N>
```

**Run with coverage**:

```bash
yarn jest-coverage
```

**Run specific workspace tests**:

```bash
yarn workspace jest-environment-node test
```

**Additional useful scripts**:

```bash
yarn clean-e2e          # Clean e2e test artifacts
yarn test-leak          # Run memory leak detection tests
yarn jest-jasmine-ci    # CI mode with jasmine2 runner
yarn test-ts            # Run TypeScript integration tests
```

### Test Configuration

- Main config: `jest.config.mjs`
- CI config: `jest.config.ci.mjs` (includes junit reporter, GitHub Actions reporter)
- TypeScript integration tests: `jest.config.ts.mjs`
- Tests use `jest-circus` as the default test runner

### Environment Variables

- `JEST_JASMINE=1` - Use jest-jasmine2 runner instead of jest-circus
- `GLOBALS_CLEANUP=off` - Disable globals cleanup in test environment

### E2E Tests

Located in `e2e/` with ~190 integration test directories:

- E2E tests execute Jest itself as a subprocess
- Each subdirectory is a test fixture
- Tests verify behavior through `status`, `stdout`, and `stderr`
- **Do not use mocks in e2e tests** (enforced by ESLint) - use fixture files instead

**Running E2E tests manually**:

```bash
cd e2e/<test-directory>
node ../../packages/jest-cli/bin/jest.js
```

**Note**: Some tests may require Mercurial (`hg`) to be installed. On macOS: `brew install hg`

## Linting & Code Quality

### Linting Commands

**Lint all code** (JavaScript, TypeScript, Markdown):

```bash
yarn lint
```

- Uses ESLint 9.x with flat config (`eslint.config.mjs`)
- Caches results for faster subsequent runs
- Takes 1-2 minutes

**Lint specific files/directories**:

```bash
yarn eslint packages/jest-mock
```

**Lint TypeScript files with type information**:

```bash
yarn lint-ts-files
```

**Format code with Prettier**:

```bash
yarn lint:prettier
```

**Check Prettier formatting**:

```bash
yarn lint:prettier:ci
```

### TypeScript Checks

**Typecheck examples**:

```bash
yarn typecheck:examples
```

**Typecheck tests**:

```bash
yarn typecheck:tests
```

**Run type tests** (using [TSTyche](https://tstyche.org/)):

```bash
yarn test-types
```

**Verify old TypeScript compatibility** (v5.4+):

```bash
yarn verify-old-ts
```

## Yarn Constraints & Validation

Jest uses [Yarn Constraints](https://yarnpkg.com/features/constraints) defined in `yarn.config.cjs`:

**Check constraints**:

```bash
yarn constraints
```

**Auto-fix constraint violations**:

```bash
yarn constraints --fix
```

**Check for duplicate dependencies**:

```bash
yarn dedupe --check
```

**Fix duplicate dependencies**:

```bash
yarn dedupe
```

**Key Constraints**:

1. Same dependency versions across workspaces (except @types/node)
2. No dependency in both `dependencies` and `devDependencies`
3. All public packages must have license, repository, publishConfig, and engines fields
4. Main/types fields must start with `./`

## CI/CD Pipeline

### GitHub Actions Workflows (`.github/workflows/`)

**Main CI**: `nodejs.yml` - Runs on push to main, PRs, and merge groups

- **Static Checks**: Lint, typecheck, prettier, changelog validation, copyright headers, constraints
- **TypeScript Compatibility**: Test with TS 5.4+, run type tests
- **Test Matrix**: Ubuntu/macOS/Windows × Node 18/20/22/24 × 4 shards
- **Test Leak Detection**: Verify no memory leaks
- **Coverage**: 4 shards with codecov upload

**Test Workflow**: `test.yml` (reusable)

- Runs tests across multiple Node versions and OS
- Uses sharding for parallel execution
- Includes jest-jasmine2 compatibility tests

**Other Workflows**:

- `prepare-cache.yml` - Prepares Yarn cache
- `nightly.yml` - Nightly test runs
- `test-nightly.yml` - Test against nightly Node versions

### Validation Checklist Before Pushing

Always run these before creating a PR (these match what CI runs):

1. `yarn build:js` - Build must succeed (or `yarn build` for type work)
2. `yarn lint` - No ESLint errors
3. `yarn lint:prettier:ci` - Code must be formatted
4. `yarn jest --config jest.config.ci.mjs` - Tests must pass
5. `yarn check-changelog` - CHANGELOG.md links must be valid
6. `yarn check-copyright-headers` - All source files need copyright header
7. `yarn constraints` - Yarn workspace constraints must pass
8. `yarn dedupe --check` - No duplicate dependencies
9. `yarn verify-pnp` - Verify Yarn PnP compatibility

## Code Style & Conventions

### Required Copyright Header

All `.js`, `.ts`, `.tsx`, `.mjs`, `.cjs` source files must start with:

```javascript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
```

This is enforced by `yarn check-copyright-headers` in CI.

### ESLint-Enforced Rules (Critical)

These are enforced by ESLint and will fail CI if violated:

- **Use `graceful-fs` instead of `fs`** - Direct `fs` imports are banned
- **Use `globalThis` instead of `global`** - The `global` identifier is banned
- **Sort object keys alphabetically** - Enforced by `sort-keys` rule
- **Sort imports alphabetically** - Within groups, enforced by `import-x/order`

### Code Formatting

From `CONTRIBUTING.md`:

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: 80 characters strongly preferred
- **Quotes**: Prefer `'` over `"` (enforced by Prettier)
- **Semicolons**: Required
- **Trailing Commas**: Required (enforced by Prettier)
- **ES6 Syntax**: Use when possible
- **TypeScript**: Use for all new code

Prettier config in `package.json`:

```json
{
  "bracketSpacing": false,
  "proseWrap": "never",
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid"
}
```

## Project Structure

### Root Files

- `package.json` - Monorepo root with scripts
- `lerna.json` - Lerna configuration
- `babel.config.js` - Babel presets and plugins
- `eslint.config.mjs` - ESLint flat config
- `jest.config.mjs` - Jest test configuration
- `tsconfig.json` - TypeScript base config
- `yarn.config.cjs` - Yarn constraints
- `.yarnrc.yml` - Yarn Berry configuration

### Key Directories

- **`packages/`** - All 55+ Jest packages (babel-jest, jest-cli, jest-config, etc.)
- **`e2e/`** - 190+ integration test directories
- **`examples/`** - Usage examples (React, Angular, TypeScript, etc.)
- **`scripts/`** - Build and maintenance scripts
- **`website/`** - Documentation website (Docusaurus)
- **`docs/`** - Markdown documentation
- **`.github/workflows/`** - CI/CD configurations

### Important Packages

Core packages in `packages/`:

- `jest` - Main entry point
- `jest-cli` - Command-line interface
- `jest-config` - Configuration handling
- `jest-core` - Core test runner
- `jest-runtime` - Module runtime
- `jest-circus` - Default test runner
- `jest-jasmine2` - Legacy test runner
- `expect` - Assertion library
- `jest-snapshot` - Snapshot testing
- `babel-jest` - Babel transformer

## Common Pitfalls & Workarounds

### Build Issues

1. **"Module not found" errors**: Run `yarn build` - packages must be built before use
2. **TypeScript errors during build**: These are often warnings about TypeScript version mismatches - safe to proceed if build completes
3. **Build cache issues**: Run `yarn build-clean` then `yarn build`

### Test Issues

1. **"No tests found"**: Jest requires specific test file patterns - check `jest.config.mjs` `testPathIgnorePatterns`
2. **Tests timing out**: Default timeout is 70 seconds (70_000ms in config) - long-running tests may need adjustment
3. **E2E test failures**: Some E2E tests require mercurial (`hg`) - install with `brew install hg` on macOS

### Workspace Issues

1. **Dependency conflicts**: Run `yarn constraints --fix` then `yarn dedupe`
2. **Peer dependency warnings**: Existing ones are expected - but avoid introducing new ones
3. **Lockfile modifications**: Always use `yarn install --immutable` in CI or when pulling changes

## Making Changes

### Contributing Requirements

1. **Fork and branch**: Fork the repo, create branch from `main`
2. **Install dependencies**: `yarn install`
3. **Build**: `yarn build`
4. **Make changes**: Add/modify code and tests
5. **Add tests**: Unit tests in `__tests__/` or e2e tests in `e2e/`
6. **Update docs**: If changing APIs
7. **Lint and test**: `yarn lint && yarn test` (or subset)
8. **Add changelog entry**: Update `CHANGELOG.md` under "## main" section

- Format: `` `[package-name]` Description ([#PR_NUMBER](link)) ``
- Example: `` `[jest-config]` Add `defineConfig` helper ([#15844](...)) ``
- Sort entries alphabetically by package name

### Changelog Format

All changes require a changelog entry under appropriate section:

- **Features**: New functionality
- **Fixes**: Bug fixes
- **Chore & Maintenance**: Docs, dependencies, cleanup, refactoring

Multiple packages: `` `[jest-core, jest-cli]` Description ``

## Performance Considerations

- **`yarn build:js`**: ~5 seconds (sufficient for most development)
- **Full `yarn build`**: 3-5 minutes (includes TypeScript declarations)
- **Full test suite**: 10+ minutes
- **Lint**: 1-2 minutes
- **Install**: ~45 seconds
- **Watch mode**: Incremental rebuilds in seconds

Use sharding and parallel execution for faster CI:

```bash
yarn test-ci-partial:parallel --max-workers <N> --shard=1/4
```

## Trust These Instructions

These instructions have been validated by running actual commands in the Jest repository. When following these instructions:

- Commands have been tested and work correctly
- Order of operations is critical (install → build → test/lint)
- Timing estimates are based on actual runs
- Warnings mentioned are expected and safe to ignore

Only perform additional searches if:

- Information here is incomplete for your specific task
- You encounter errors not covered in these instructions
- You need details about a specific package's internals

## Additional Resources

- Main docs: https://jestjs.io
- Contributing guide: `CONTRIBUTING.md`
- API Reference: https://jestjs.io/docs/api
- GitHub: https://github.com/jestjs/jest
