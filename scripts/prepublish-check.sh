#!/bin/bash
set -e

echo "Running pre-publish checks..."

# Check if dist exists and has expected files
echo "Checking dist..."
if [ ! -f "dist/index.js" ]; then
  echo "ERROR: dist/index.js not found. Run npm run build first."
  exit 1
fi

if [ ! -f "dist/index.cjs" ]; then
  echo "ERROR: dist/index.cjs not found."
  exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
  echo "ERROR: dist/index.d.ts not found."
  exit 1
fi

# Check package.json
echo "Checking package.json..."
if ! grep -q '"name": "byof"' package.json; then
  echo "ERROR: Package name is not 'byof'"
  exit 1
fi

# Check required files
echo "Checking required files..."
for file in README.md LICENSE SECURITY.md CHANGELOG.md; do
  if [ ! -f "$file" ]; then
    echo "ERROR: $file not found."
    exit 1
  fi
done

# Dry run npm pack to see what will be published
echo ""
echo "Files that will be published:"
npm pack --dry-run

echo ""
echo "All checks passed!"
