
   
constraints_min_version(1).

% This file is written in Prolog
% It contains rules that the project must respect.
% In order to see them in action, run `yarn constraints source`

% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  % Iterates over all dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Iterates over similarly-named dependencies from all workspaces (again)
    workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  % Ignore peer dependencies
    DependencyType \= 'peerDependencies',
    DependencyType2 \= 'peerDependencies',
  % Get the workspace name
    workspace_ident(WorkspaceCwd, WorkspaceIdent),
    workspace_ident(OtherWorkspaceCwd, OtherWorkspaceIdent),
  % Ignore enzyme example workspace, enzyme don't support react 17
    WorkspaceIdent \= 'example-enzyme',
    OtherWorkspaceIdent \= 'example-enzyme'.

