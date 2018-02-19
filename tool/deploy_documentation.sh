#!/bin/bash
set -e # Exit with nonzero exit code if anything fails

GITHUB_USER="InexorBot"
GITHUB_EMAIL="info@inexor.org"
SOURCE_BRANCH="master"
TARGET_BRANCH="gh-pages"

function doCompile {
  npm run docs
}

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping deploy; just doing a build."
    doCompile
    exit 0
fi

# Save some useful information
REPO=`git config remote.origin.url`
TOKEN_REPO=${REPO/github.com/$GITHUB_USER:$GITHUB_TOKEN@github.com}
SHA=`git rev-parse --verify HEAD`

# Clone the existing gh-pages for this repo into out/
# Create a new empty branch if gh-pages doesn't exist yet (should only happen on first deply)
git clone $REPO out
cd out
git checkout $TARGET_BRANCH || git checkout --orphan $TARGET_BRANCH
cd ..

# Clean out existing contents
rm -rf out/**/* || exit 0

# Run our compile script
doCompile

# Now let's go have some fun with the cloned repo
cd out
git config user.name ${GITHUB_USER}
git config user.email ${GITHUB_EMAIL}

# Use a shadow commit to add differences in previously uncommited files
git add -A --intent-to-add .

# If there are no changes to the compiled out (e.g. this is a README update) then just bail.
if git diff --quiet; then
    echo "No changes to the output on this push; exiting."
    exit 0
fi

# Commit the "changes", i.e. the new version.
# The delta will show diffs between new and old versions.
git add -A .
git commit -m "Upload documentation to GitHub Pages: ${SHA}"

# Now that we're all set up, we can push.
git push $TOKEN_REPO $TARGET_BRANCH
