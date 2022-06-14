constraints_min_version(1).

% This file is written in Prolog
% It contains rules that the project must respect.
% Check with "yarn constraints" (fix w/ "yarn constraints --fix")
% Yarn Constraints https://yarnpkg.com/features/constraints
% Reference for other constraints:
%   https://github.com/babel/babel/blob/main/constraints.pro
%   https://github.com/yarnpkg/berry/blob/master/constraints.pro

% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  % Iterates over all dependencies from all workspaces
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Iterates over similarly-named dependencies from all workspaces (again)
  workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  % Ignore peer dependencies
  DependencyType \= 'peerDependencies',
  DependencyType2 \= 'peerDependencies',
  % Ignore workspace:*: we use both `workspace:*` and real version such as `^28.0.0-alpha.8` to reference package in monorepo
  % TODO: in the future we should make it consistent and remove this ignore
  DependencyRange \= 'workspace:*',
  DependencyRange2 \= 'workspace:*',
  % A list of exception to same version rule
  \+ member(DependencyIdent, [
    % Allow enzyme example workspace use a older version react and react-dom, because enzyme don't support react 17
    'react', 'react-dom',
    % @types/node in the root need to stay on ~12.12.0
    '@types/node',
    % upgrading the entire repository is a breaking change
    'glob'
  ]).

% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').

% Enforces the license in all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'license', 'MIT') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'license', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces the repository field for all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'repository.type', 'git') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.url', 'https://github.com/facebook/jest.git') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository.directory', WorkspaceCwd) :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'repository', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces 'publishConfig.access' is set to public for public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'publishConfig.access', 'public') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'publishConfig.access', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces the engines.node field for public workspace
gen_enforced_field(WorkspaceCwd, 'engines.node', '^12.13.0 || ^14.15.0 || ^16.10.0 || >=17.0.0') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).

% Enforces the main and types field to start with ./
gen_enforced_field(WorkspaceCwd, FieldName, ExpectedValue) :-
  % Fields the rule applies to
  member(FieldName, ['main', 'types']),
  % Get current value
  workspace_field(WorkspaceCwd, FieldName, CurrentValue),
  % Must not start with ./ already
  \+ atom_concat('./', _, CurrentValue),
  % Store './' + CurrentValue in ExpectedValue
  atom_concat('./', CurrentValue, ExpectedValue).
