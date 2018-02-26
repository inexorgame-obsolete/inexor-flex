#! /bin/bash

# this makes the entire script fail if one commands fail
set -e

if [ "$branch" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
    # direct push to master
    echo "This is a direct push to master. \n\n"
else
    echo >&2 -e "\n===============\n" \
    "Skipping publishing, because this is \n" \
    "not a direct commit to master.\n" \
    "Branch: ${branch} - TRAVIS_PULL_REQUEST: ${TRAVIS_PULL_REQUEST}\n" \
    "===============\n"
    exit 0
fi


if ! [ "$INEXOR_PATCH_VERSION" = "0" ]; then
    if [ "$main_repo" = "inexorgame/inexor-flex" ]; then
        echo >&2 -e "\n===============\n" \
        "New Major or Minor version. \n" \
        "Do nothing. The npm package is already published. \n" \
        "===============\n"
        exit 0
    fi
fi

if [ "$main_repo" = "inexorgame/inexor-flex" ]; then
    if ! [ "$PUBLISH_NEW_MINOR" = "true" ]; then
        echo >&2 -e "\n===============\n" \
        "This is executed by the push of a tag. \n" \
        "Do nothing. The npm package is already published. \n" \
        "===============\n"
        exit 0
    fi

    if [[ "`git log -1 --pretty=%B`" == *"Rolling release: Increase version to"* ]]; then
        echo >&2 -e "\n===============\n" \
        "This is executed by a commit of a rolling release. \n" \
        "Do nothing. The npm package is already published. \n" \
        "===============\n"
        exit 0
    fi
fi


git config --global user.email "ci@inexor.org"
git config --global user.name "InexorBot"

echo -e "${NPM_USER}\n${NPM_PASSWORD}\n${NPM_EMAIL}" | npm login
npm whoami

echo "Using version: ${INEXOR_VERSION}"
# DO NOT CHANGE npm version TO yarn version
# OR WE HAVING A HARD TIME DETECTING THIS AUTO-GENERATED COMMIT IN THE NEXT AUTO-TRAVIS-RUN
npm version ${INEXOR_VERSION}

yarn test
yarn publish --new-version ${INEXOR_VERSION}

git commit -am "Rolling release: Increase version to ${new_version}"
git push -q https://$GITHUB_TOKEN@github.com/inexorgame/inexor-flex


exit 0
