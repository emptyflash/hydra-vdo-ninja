#!/bin/bash

# Simple build script for hydra-vdo-ninja
# This bundles the main library files if needed

echo "Building hydra-vdo-ninja..."

# Check if files exist
if [ ! -f "hydra-vdo-ninja.js" ]; then
    echo "Error: hydra-vdo-ninja.js not found"
    exit 1
fi

if [ ! -f "hydra-vdo-ninja-integration.js" ]; then
    echo "Error: hydra-vdo-ninja-integration.js not found"
    exit 1
fi

# Create a bundled version (optional)
echo "Creating bundled version..."
cat > hydra-vdo-ninja-bundle.js << 'EOF'
/**
 * Hydra-vdo.ninja Integration Bundle
 * Includes both main library and integration helpers
 */
EOF

cat hydra-vdo-ninja.js >> hydra-vdo-ninja-bundle.js
echo "" >> hydra-vdo-ninja-bundle.js
cat hydra-vdo-ninja-integration.js >> hydra-vdo-ninja-bundle.js

echo "Build complete!"
echo "Files created:"
echo "- hydra-vdo-ninja-bundle.js (bundled version)"
echo ""
echo "Usage:"
echo "- Include hydra-vdo-ninja-bundle.js after Hydra in your HTML"
echo "- Or use individual files: hydra-vdo-ninja.js + hydra-vdo-ninja-integration.js"

