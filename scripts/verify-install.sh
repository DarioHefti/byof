#!/bin/bash
set -e

echo "Verifying clean install..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Save current directory
ORIG_DIR=$(pwd)

# Pack the current package
npm pack

# Move to temp directory
cd "$TEMP_DIR"

# Create a test project
npm init -y

# Install the package
npm install "$ORIG_DIR"/byof-*.tgz

# Create a simple ESM test file
cat > test.mjs << 'EOF'
import { createByof, VERSION } from 'byof'

console.log('VERSION:', VERSION)
console.log('createByof:', typeof createByof)

if (typeof createByof !== 'function') {
  console.error('ERROR: createByof is not a function')
  process.exit(1)
}

console.log('SUCCESS: ESM import works correctly')
EOF

# Create a simple CJS test file
cat > test.cjs << 'EOF'
const { createByof, VERSION } = require('byof')

console.log('VERSION:', VERSION)
console.log('createByof:', typeof createByof)

if (typeof createByof !== 'function') {
  console.error('ERROR: createByof is not a function')
  process.exit(1)
}

console.log('SUCCESS: CJS require works correctly')
EOF

# Run the ESM test
echo ""
echo "Testing ESM import..."
node test.mjs

# Run the CJS test
echo ""
echo "Testing CJS require..."
node test.cjs

# Cleanup
cd "$ORIG_DIR"
rm -rf "$TEMP_DIR"
rm byof-*.tgz

echo ""
echo "Clean install verification passed!"
