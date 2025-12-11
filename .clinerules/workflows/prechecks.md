# Pre-Merge Prechecks Workflow 🚦

This workflow ensures code quality and build integrity before merging changes to the main branch.

## Purpose

Run comprehensive quality checks to verify that:

- ✅ Code passes linting rules
- ✅ Code formatting is consistent
- ✅ TypeScript types are valid
- ✅ Project builds successfully
- ✅ No unused dependencies

## When to Use

Run this workflow:

- ✨ Before creating a merge/pull request
- ✨ After making significant changes
- ✨ When asked to prepare code for merging
- ✨ Before committing final changes

## Workflow Steps

### 1. TypeScript Type Check 🔍

**Run:** `npm run tsc-check`

**Purpose:** Validates all TypeScript types without emitting files

**If it fails:**

- Review the type errors carefully
- Fix type issues - **never use `any` to bypass errors**
- Run `tsc-check` again until it passes
- Common fixes:
  - Add proper type annotations
  - Import missing types
  - Fix incorrect type usage
  - Update GraphQL codegen if schema changed

### 2. Linting Check 🔎

**Run:** `npm run lint`

**Purpose:** Checks code against ESLint rules

**If it fails:**

- Review the linting errors
- Fix issues manually or let ESLint auto-fix when possible
- Many issues can be auto-fixed with `npm run lint -- --fix`
- Re-run `npm run lint` to verify
- Common issues:
  - Unused variables/imports
  - Missing dependencies in useEffect
  - Improper React hooks usage
  - Console statements left in code

### 3. Prettier Format Check 💅

**Run:** `npm run prettier:check`

**Purpose:** Verifies code formatting consistency

**If it fails:**

- **Always run:** `npm run prettier:fix`
- This auto-formats all files to match project style
- Re-run `prettier:check` to verify (should pass now)
- Commit the formatted changes

### 4. Dependency Check 📦

**Run:** `npm run test:depcheck`

**Purpose:** Identifies unused dependencies in package.json

**If it fails:**

- Review the unused dependencies reported
- Consider removing truly unused packages
- Some false positives may occur for:
  - Build-time dependencies
  - Peer dependencies
  - Type-only imports
- If unsure, ask the user whether to remove specific packages

### 5. Build Verification 🏗️

**Run:** `npm run build`

**Purpose:** Ensures the project builds successfully for production

**If it fails:**

- Read the build error carefully
- Common issues:
  - TypeScript errors (should be caught in step 1)
  - Missing environment variables
  - Import/export issues
  - GraphQL codegen not run (`npm run codegen`)
  - CSS/Tailwind configuration issues
- Fix the errors and rebuild
- **This is the critical final check - must pass!**

## Full Precheck Command Sequence

Run these commands in order:

```bash
npm run tsc-check
npm run lint
npm run prettier:check
npm run test:depcheck
npm run build
```

## Auto-Fix Strategy

When errors are found, attempt fixes in this order:

1. **Prettier issues** → Always run `npm run prettier:fix`
2. **TypeScript errors** → Manually fix (never use `any`)
3. **Lint errors** → Try `npm run lint -- --fix`, then manual fixes
4. **Dependency issues** → Consult with user before removing
5. **Build errors** → Investigate root cause, fix, and rebuild

## Success Criteria ✅

All commands must complete with:

- Exit code 0 (success)
- No errors in output
- No warnings that indicate breaking issues

Once all checks pass, the code is ready to merge! 🎉

## Notes

- These checks mirror what CI/CD pipelines typically run
- Catching issues locally saves time and CI resources
- Always run after finishing work on a task
- If multiple rounds of fixes are needed, that's normal - keep iterating until clean
