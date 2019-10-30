#!/bin/bash -ex

npm i lerna
npm run npm-ci-all
npx lerna run build
npx lerna exec -- npm ci --production --ignore-scripts
# npx lerna exec --no-bail -- rm -rf ./node_modules
# npm cache clean --force
