#!/bin/sh

cd ../../jest-gh-pages && \
git fetch && \
git rebase && \
cd ../jest/website && \
node server/generate.js && \
cp -R build/jest/* ../../jest-gh-pages/ && \
rm -Rf build/ && \
cd ../../jest-gh-pages && \
git add --all && \
git commit -m "update website" && \
git push && \
cd ../jest/website
