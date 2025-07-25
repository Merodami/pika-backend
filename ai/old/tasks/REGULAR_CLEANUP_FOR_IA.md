# Regular Cleanup for AI

Simple cleanup commands to keep the codebase healthy. Run these in order:

## Quick Cleanup (Most Common)

For each one, run it and FIX any ERROR. Warnings are accepted.
Iterate to the next command when all is fixed.

```bash
# 1. Format code with ESLint
yarn lint:fix

# 2. Format code with Prettier
yarn prettier --write .

# 3. Check types
yarn typecheck

# 4. Run linting
yarn lint

# 5. Validate everything
yarn validate:all
```

And later:
Resolve all not complex yarn lint:fix warnings (You can iterate on each project, fixing one by one):

- If you can remove a parameter for not been used, remove it.
- If you cannot remove a parameter or similar, add \_{paramName}.

## Final Verification

After all cleanup is done, verify everything works:

```bash
# 6. Build all packages
yarn build

# 7. Run tests
yarn vitest
```

## Common Fixes

### TypeScript Import Errors

Always use `.js` extension in imports:

```typescript
import { Service } from './service.js' // ✓ Correct
import { Service } from './service' // ✗ Wrong
```

### Unused Variables

- Remove them or prefix with underscore: `_unusedParam`

### Module/Cache Issues

```bash
yarn nx reset
yarn clean
```

## Full Cleanup (When Things Break)

```bash
# 1. Clean everything
yarn clean
yarn nx reset

# 2. Reinstall
rm -rf node_modules
yarn install

# 3. Regenerate Prisma
yarn db:generate

# 4. Build
yarn build
```

## Testing After Changes

```bash
# Run tests to ensure nothing broke
yarn test

# For specific service
yarn test:service [service-name]
```

## Remember

- Run `yarn lint:fix` before committing
- Run `yarn typecheck` to catch errors early
- Don't need to change branches or remove files
- Focus on fixing errors shown by the commands
- For object injection sink fix, use lodash-es
- Also you need to remove any not used dependencies
