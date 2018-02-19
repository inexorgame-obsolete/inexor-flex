#! /bin/bash

# Check whether this build is either triggered by a tag or whether
# there already is a tag on the specified commit.
need_new_tag() {
  export current_tag=`git tag --contains`
  if test -n "$current_tag"; then
    false
  else
    true
  fi
}

## increment the version number based on the last tag.
incremented_version()
{
  channel_tag = $0
  local major_version=`echo -e "${last_tag}" | sed "s/^\(.*\)\\.[0-9]\+\.[0-9]\+.*$/\1/"`
  local minor_version=`echo -e "${last_tag}" | sed "s/^[0-9]\+\.\(.*\)\.[0-9]\+.*$/\1/"`
  local patch_version=`echo -e "${last_tag}" | sed "s/^[0-9]\+\.[0-9]\+\.\(.[0-9]*\).*$/\1/"`

  local new_patch_version=$((patch_version+1))
  local new_version="$major_version.$minor_version.$new_patch_version${channel_tag}"
  echo $new_version
}

# increment version and create a tag on GitHub
# each time we push to master, check are in travis.yml
create_tag() {
  need_new_tag || {
    echo >&2 -e "===============\n" \
      "Skipping tag creation, because this build\n" \
      "got triggered by a tag\n" \
      "or because there is already a tag.\n" \
      "===============\n"
    exit 0
  }

  if [ "$branch" = "master" -a "$TRAVIS_PULL_REQUEST" = "false" ]; then
    # direct push to master

    export new_version=$(incremented_version)
    echo >&2 -e $new_version

    git config --global user.email "ci@inexor.org"
    git config --global user.name "InexorBot"

    git tag -a -m "Rolling release: automatic tag creation on push to master branch" "${new_version}"
    git push -q https://$GITHUB_TOKEN@github.com/inexorgame/inexor-flex --tags

  else
    echo >&2 -e "\n===============\n" \
    "Skipping tag creation, because this is \n" \
    "not a direct commit to master.\n" \
    "===============\n"
    export new_version=$(incremented_version)
  fi
}


## MAIN ####################################################

# this makes the entire script fail if one commands fail
set -e


export branch=`git rev-parse --abbrev-ref HEAD` # The branch we're on
export commit_date=`git show -s --format=%cd --date=format:%Y-%m-%d-%H-%m-%S`

# Name of this build
export build="$(echo "${branch}-${commit_date}" | sed 's#/#-#g')-${TARGET}"
export main_repo="inexorgame/inexor-flex"



# Tags do not get fetched from travis usually.
git fetch origin 'refs/tags/*:refs/tags/*'
export last_tag=`git describe --tags $(git rev-list --tags --max-count=1)`

# The queue is:
# a tag gets created on push to the master branch (using travis), then we push the
# tag to github and that push triggers travis again (which uploads the release packages)

# We use the last tag as version for the package creation
export INEXOR_VERSION=${last_tag}
need_new_tag && {
  # If we want a new tag
  # We use the last tag of the master branch + 1.
  export INEXOR_VERSION=$(incremented_version)
}


create_tag

exit 0
