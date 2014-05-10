#!/bin/sh

cd ../../jest-gh-pages && \
git checkout -- . && \
git clean -dfx && \
git fetch && \
git rebase && \
rm -Rf * && \
cd ../jest/website && \
node server/generate.js && \
cp -R build/jest/* ../../jest-gh-pages/ && \
rm -Rf build/ && \
cd ../../jest-gh-pages && \
git add --all && \
git commit -m "update website" && \
git push && \
cd ../jest/website
