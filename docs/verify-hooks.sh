#!/bin/bash
# Verification script for React Query hooks implementation

echo "🔍 React Query Hooks Verification"
echo "=================================="
echo ""

# Check files exist
echo "📁 Checking files..."
FILES=(
  "features/image-generation/hooks/use-projects.ts"
  "features/image-generation/hooks/use-image-generation.ts"
  "features/image-generation/hooks/use-upload.ts"
  "features/image-generation/hooks/index.ts"
  "features/image-generation/hooks/README.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (missing)"
  fi
done

echo ""
echo "📊 Code Statistics:"
echo "-------------------"
wc -l features/image-generation/hooks/*.ts features/image-generation/hooks/*.md | tail -1

echo ""
echo "🎯 TypeScript Check:"
echo "-------------------"
npm run typecheck 2>&1 | grep -E "(error TS|✨)" | head -5 || echo "  ✅ No type errors in hooks"

echo ""
echo "✅ Verification Complete!"
