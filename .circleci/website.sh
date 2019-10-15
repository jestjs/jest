#!/bin/bash

set -e

git diff-tree --no-commit-id --name-only -r HEAD > files_changed.txt
if ! grep -E "(^docs\/.*)|(^website\/.*)" files_changed.txt; then
    echo "Skipping deploy & test. No relevant website files have changed"
else
    echo "Relevant website files have changed"
    if [[ $CIRCLE_PROJECT_USERNAME == "facebook" && -z $CI_PULL_REQUEST && -z $CIRCLE_PR_USERNAME ]]; then
        # configure Docusaurus bot
        git config --global user.email "docusaurus-bot@users.noreply.github.com"
        git config --global user.name "Website Deployment Script"
        echo "machine github.com login docusaurus-bot password $DOCUSAURUS_PUBLISH_TOKEN" > ~/.netrc
        # install Docusaurus and generate file of English strings
        yarn && cd website && yarn write-translations
        # crowdin install
        sudo apt-get update
        sudo apt-get install default-jre rsync
        wget https://artifacts.crowdin.com/repo/deb/crowdin.deb -O crowdin.deb
        sudo dpkg -i crowdin.deb
        # translations upload/download
        yarn crowdin-upload
        # download only enabled languages
        for lang in ja es-ES ro zh-CN pt-BR ru uk
        do
            yarn crowdin-download -l $lang
        done
        # build and publish website
        GIT_USER=docusaurus-bot USE_SSH=false yarn publish-gh-pages
    else
        echo "Skipping deploy. Test website build"
        cd website && yarn && yarn build
    fi
fi
