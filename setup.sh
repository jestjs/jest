#!/bin/bash

echo "Setting up Jest's development environment..."
node_modules/.bin/lerna bootstrap

(cd packages/jest-jasmine1 && npm link)
(cd packages/jest-jasmine2 && npm link)
(cd packages/jest-mock && npm link)
(cd packages/jest-util && npm link)

npm link jest-jasmine1
npm link jest-jasmine2
npm link jest-mock
npm link jest-util
