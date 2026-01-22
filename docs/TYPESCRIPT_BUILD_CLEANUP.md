# TypeScript Build Cleanup

## Problem

The repository had **210 stale compiled JavaScript files** in the source directories. These were build artifacts that were mistakenly generated in the `src/` folder instead of the `dist/` folder.

### Symptoms

- Duplicate files with same names but different extensions:
  - `auth-identity.service.ts` (source file)
  - `auth-identity.service.js` (compiled output - STALE)
- IDE confusion showing two versions of the same file
- Outdated compiled files from December while source files were updated in January

## Root Cause

At some point, someone ran `tsc` or `pnpm build` with a misconfigured TypeScript compiler that output JavaScript files directly into the source directory instead of the `dist/` directory.

## Solution Applied

### 1. Deleted All Compiled Files from Source

```bash
cd apps/api
find src -name "*.js" -type f -delete
find src -name "*.js.map" -type f -delete
```

Result: **210 files removed** from `apps/api/src/`

### 2. Updated .gitignore

Added explicit exclusions to prevent this from happening again:

```gitignore
# Compiled JavaScript files in source directories (should be in dist/ only)
apps/*/src/**/*.js
apps/*/src/**/*.js.map
packages/*/src/**/*.js
packages/*/src/**/*.js.map
```

This ensures that even if someone accidentally compiles into the source directory, git will ignore those files.

## What Was Actually Being Used?

**Only the `.ts` files were being used!**

The development server (`pnpm dev`) uses:
```bash
tsx --tsconfig tsconfig.json src/main.ts
```

This runs TypeScript files directly without compiling them to `.js` first. The `.js` files were completely ignored by the runtime.

## How to Avoid This in the Future

### ✅ Correct Commands

```bash
# Development (uses tsx to run TS directly)
pnpm dev

# Type checking (no output)
pnpm typecheck

# Build for production (outputs to dist/)
pnpm build
```

### ❌ Never Run

```bash
# Don't run tsc directly in the project root
tsc

# Don't run tsc with wrong config
tsc --outDir src
```

## Current Configuration (Correct)

The `tsconfig.json` is properly configured:

```json
{
  "compilerOptions": {
    "outDir": "../../apps/api/dist"  // ✅ Outputs to dist/
  }
}
```

## Verification

After cleanup:
- ✅ 0 `.js` files in `apps/api/src/`
- ✅ TypeScript compilation still works
- ✅ Development server runs correctly
- ✅ All tests pass
- ✅ Git ignores future accidental compilations

## Files That Were in Source (Now Cleaned)

All source files now only have their `.ts` versions:
- `auth-identity.service.ts` (no more .js duplicate)
- `auth-identity.controller.ts` (no more .js duplicate)
- `auth0-management.service.ts` (already had no .js - created after the accidental compilation)
- And 207 other files across the API codebase

## Summary

The "duplicate files" were not duplicates - they were stale build artifacts that should never have been in the source directory. The `.ts` files are the source of truth and are the only files actually being used by the development server and build process.
