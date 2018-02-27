#! /bin/bash

# Check whether this build is either triggered by a tag or whether
# there already is a tag on the specified commit.
need_new_tag() {
  export current_tag=`git tag --contains`
  if test -n "$current_tag"; then
    export NEED_NEW_TAG=false
    false
  else
    export NEED_NEW_TAG=true
    true
  fi
}

get_versions()
{
    export INEXOR_MAJOR_VERSION=`echo -e "${last_tag}" | sed "s/^\(.*\)\\.[0-9]\+\.[0-9]\+.*$/\1/"`
    export INEXOR_MINOR_VERSION=`echo -e "${last_tag}" | sed "s/^[0-9]\+\.\(.*\)\.[0-9]\+.*$/\1/"`
    export INEXOR_PATCH_VERSION=`echo -e "${last_tag}" | sed "s/^[0-9]\+\.[0-9]\+\.\(.[0-9]*\).*$/\1/"`
}

## increment the version number based on the last tag.
incremented_version()
{
  local channel_tag=${1}
  get_versions

  export INEXOR_PATCH_VERSION=$((INEXOR_PATCH_VERSION+1))
  local new_version="$INEXOR_MAJOR_VERSION.$INEXOR_MINOR_VERSION.$INEXOR_PATCH_VERSION${channel_tag}"
  echo $new_version
}

# increment version and create a tag on GitHub
# each time we push to master, check are in travis.yml
create_tag_when_needed() {
  if ! [ "$NEED_NEW_TAG" = "true" ]; then
    echo >&2 -e "===============\n" \
      "Skipping tag creation, because this build\n" \
      "got triggered by a tag\n" \
      "or because there is already a tag.\n" \
      "===============\n"
    exit 0
  fi

  if [ "$branch" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
    # direct push to master

    export new_version=$(incremented_version)
    echo >&2 -e $new_version

    git config --global user.email ${GITHUB_BOT_EMAIL}
    git config --global user.name ${GITHUB_BOT_NAME}

    git tag -a -m "Rolling release: automatic tag creation on push to master branch" "${new_version}"
    git push -q https://$GITHUB_TOKEN@github.com/${main_repo} --tags

  else
    echo >&2 -e "\n===============\n" \
    "Skipping tag creation, because this is \n" \
    "not a direct commit to master.\n" \
    "Branch: ${branch} - TRAVIS_PULL_REQUEST: ${TRAVIS_PULL_REQUEST}\n" \
    "===============\n" \
    "Current version is: ${last_tag} \n" \
    "Next version would have been: $(incremented_version) \n" \
    "===============\n"
  fi
}


## MAIN ####################################################

# this makes the entire script fail if one commands fail
set -e


# export branch=`git rev-parse --abbrev-ref HEAD` # The branch we're on
export branch=${TRAVIS_BRANCH}
export commit_date=`git show -s --format=%cd --date=format:%Y-%m-%d-%H-%m-%S`

# Name of this build
export build="$(echo "${branch}-${commit_date}" | sed 's#/#-#g')-${TARGET}"


# Tags do not get fetched from travis usually.
git fetch origin 'refs/tags/*:refs/tags/*'
export last_tag=`git describe --tags $(git rev-list --tags --max-count=1)`

# The queue is:
# a tag gets created on push to the master branch (using travis), then we push the
# tag to github and that push triggers travis again (which uploads the release packages)

# We use the last tag as version for the package creation
export PUBLISH_NEW_MINOR="false"
export INEXOR_LAST_VERSION=${last_tag}
export INEXOR_VERSION=${last_tag}
get_versions # to export INEXOR_PATCH_VERSION !

need_new_tag && {
  # If we want a new tag
  # We use the last tag of the master branch + 1.
  export PUBLISH_NEW_MINOR="true"
  export INEXOR_VERSION=$(incremented_version)
}
