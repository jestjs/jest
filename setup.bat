@echo Setting up Jest's development environment...

@rem Needed for hoist until 0.9.3 is released
set __node_env=%NODE_ENV%
set NODE_ENV=production
call npm link
set NODE_ENV=%__node_env%
cd packages\babel-plugin-jest-hoist
call npm link jest-cli
cd ..\..
@rem ========================================

call .\node_modules\.bin\lerna bootstrap

cd packages/jest-jasmine1
call npm link
cd ..\..

cd packages/jest-jasmine2
call npm link
cd ..\..

cd packages/jest-mock
call npm link
cd ..\..

cd packages/jest-util
call npm link
cd ..\..

call npm link jest-jasmine1
call npm link jest-jasmine2
call npm link jest-mock
call npm link jest-util
