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
npm version ${INEXOR_VERSION}
npm test
npm publish

git commit -am "Rolling release: Increase version to ${new_version}"
git push -q https://$GITHUB_TOKEN@github.com/inexorgame/inexor-flex


exit 0
