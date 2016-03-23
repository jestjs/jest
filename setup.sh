#!/bin/bash

echo "Setting up Jest's development environment..."
node_modules/.bin/lerna bootstrap

(cd packages/jest-mock && npm link)
npm link jest-mock
(cd packages/jest-util && npm link)
npm link jest-util
