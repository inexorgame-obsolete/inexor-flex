#! /bin/bash

# this makes the entire script fail if one commands fail
set -e

# export branch=`git rev-parse --abbrev-ref HEAD` # The branch we're on
export branch=${TRAVIS_BRANCH}

if [ "$branch" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
    # direct push to master
    echo -e "This is a direct push to master. \n\n"
else
    echo >&2 -e "\n===============\n" \
    "Skipping publishing, because this is\n" \
    "not a direct commit to master.\n" \
    "Branch: ${branch} - TRAVIS_PULL_REQUEST: ${TRAVIS_PULL_REQUEST}\n" \
    "===============\n"
    exit 0
fi


if ! [ "$main_repo" = "inexorgame/inexor-flex" ]; then
    echo >&2 -e "\n===============\n" \
    "Skipping publishing, because this is\n" \
    "a fork.\n" \
    "Repo: ${main_repo} - expected: inexorgame/inexor-flex\n" \
    "===============\n"
    exit 0
fi


if ! [ "$PUBLISH_NEW_MINOR" = "true" ]; then
    if [ "$INEXOR_PATCH_VERSION" = "0" ]; then
        echo >&2 -e "\n===============\n" \
        "New Major or Minor version detected. \n" \
        "===============\n"
    else
        echo >&2 -e "\n===============\n" \
        "This is executed by the push of a tag. \n" \
        "Do nothing. The yarn package is already published. \n" \
        "===============\n"
        exit 0
    fi
fi

if [[ "`git log -1 --pretty=%B`" == *"Rolling release: Increase version to"* ]]; then
    echo >&2 -e "\n===============\n" \
    "This is executed by a commit of a rolling release. \n" \
    "Do nothing. The yarn package is already published. \n" \
    "===============\n"
    exit 0
fi

CURRENT_MASTER_COMMIT=`git ls-remote git://github.com/inexorgame/inexor-flex.git | \
grep refs/heads/master | cut -f 1`
CURRENT_CHECKOUT_COMMIT=`git rev-parse HEAD`

if ! [ "${CURRENT_MASTER_COMMIT}" = "${CURRENT_CHECKOUT_COMMIT}" ]; then
    echo >&2 -e "\n===============\n" \
    "This is not the latest commit in the master branch. \n" \
    "Skip publishing of the Yarn package. \n" \
    "===============\n"
    exit 0
fi

git checkout master

git config --global user.email "ci@inexor.org"
git config --global user.name "InexorBot"

npm install -g npm-cli-login
npm-cli-login -u ${NPM_USER} -p ${NPM_PASSWORD} -e ${NPM_EMAIL}
npm whoami

echo -e "Using version: ${INEXOR_VERSION} \n"
# DO NOT CHANGE npm version TO yarn version
# OR WE HAVING A HARD TIME DETECTING THIS AUTO-GENERATED COMMIT IN THE NEXT AUTO-TRAVIS-RUN
npm version ${INEXOR_VERSION} --force --no-git-tag-version --message "Rolling release: Increase version to ${INEXOR_VERSION}"

# echo -e "\n Run tests \n"
# yarn test

echo -e "\n Publish package to registry \n"
yarn publish --new-version ${INEXOR_VERSION}

echo -e "\n Commit version change to GitHub \n"
git commit -am "Rolling release: Increase version to ${INEXOR_VERSION}"
git push -q https://$GITHUB_TOKEN@github.com/inexorgame/inexor-flex



echo -e "\n Create Yarn package for upload to GitHub \n"
yarn pack --filename "inexor-flex-${INEXOR_VERSION}.tgz"

export DEPLOY_TO_GITHUB=true
