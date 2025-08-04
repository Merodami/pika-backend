#!/bin/bash

# Super Simple GitHub Packages Publisher
# Assumes packages are already built (dist folders exist)

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/simple-publish.sh VERSION"
    echo "Example: ./scripts/simple-publish.sh 1.0.3"
    exit 1
fi

# Get script directory and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 Publishing version $VERSION..."

# Update versions
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$REPO_ROOT/packages/types/package.github.json"
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$REPO_ROOT/packages/api/package.github.json"
sed -i '' "s/@Merodami\/pika-types\": \".*\"/@Merodami\/pika-types\": \"^$VERSION\"/" "$REPO_ROOT/packages/api/package.github.json"

# Publish types
cd "$REPO_ROOT/packages/types"
cp package.github.json package.json
npm publish --registry=https://npm.pkg.github.com
git checkout package.json

# Wait
sleep 15

# Publish API
cd "$REPO_ROOT/packages/api"
cp package.github.json package.json
npm publish --registry=https://npm.pkg.github.com
git checkout package.json

echo "✅ Done! Published version $VERSION"