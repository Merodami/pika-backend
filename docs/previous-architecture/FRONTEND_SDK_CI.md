# Frontend SDK CI/CD Setup

## Overview

The frontend SDK is maintained as a Git submodule, which requires special handling in CI/CD pipelines.

## CI/CD Options

### Option 1: Skip Submodules in CI (Recommended)

Since the frontend SDK is distributed as a separate package, the main CI doesn't need it:

```yaml
# .github/workflows/ci.yml
- uses: actions/checkout@v4
  # No submodules parameter - skips submodule checkout
```

Update the `generate:frontend-sdk` script to handle missing directory:

```bash
# In package.json
"generate:frontend-sdk": "test -d api-microservices-sdk && (cd api-microservices-sdk && npm run generate) || echo 'Skipping frontend SDK generation (not in CI)'"
```

### Option 2: Include Submodules in CI

If you want CI to validate the frontend SDK generation:

```yaml
# .github/workflows/ci.yml
- uses: actions/checkout@v4
  with:
    submodules: recursive
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Option 3: Separate CI for Frontend SDK

Create a separate workflow that only runs when API changes:

```yaml
# .github/workflows/frontend-sdk.yml
name: Update Frontend SDK

on:
  push:
    branches: [main]
    paths:
      - 'packages/api/src/**/*.ts'
      - 'packages/api/package.json'

jobs:
  update-sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
          token: ${{ secrets.SDK_UPDATE_TOKEN }} # PAT with write access

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          yarn install --immutable
          cd api-microservices-sdk && npm ci

      - name: Generate SDK
        run: yarn generate:frontend-sdk

      - name: Check for changes
        id: check
        run: |
          cd api-microservices-sdk
          if [[ -n $(git status --porcelain) ]]; then
            echo "changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push SDK updates
        if: steps.check.outputs.changes == 'true'
        run: |
          cd api-microservices-sdk
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "chore: update SDK from API changes"
          git push origin main

      - name: Update submodule reference
        if: steps.check.outputs.changes == 'true'
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add api-microservices-sdk
          git commit -m "chore: update frontend SDK submodule"
          git push origin main
```

## Best Practices

### 1. Error Handling in Scripts

Update package.json to handle missing submodule:

```json
{
  "scripts": {
    "generate:frontend-sdk": "[ -d api-microservices-sdk ] && (cd api-microservices-sdk && npm run generate) || echo 'Frontend SDK directory not found - skipping'",
    "generate:all-sdks": "yarn generate:sdk && (yarn generate:frontend-sdk || true)"
  }
}
```

### 2. Local Development Setup

Add to your project README:

````markdown
## Setup

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>

# Or init submodules after clone
git submodule update --init --recursive
```
````

````

### 3. Docker Builds

If using Docker, update your Dockerfile:

```dockerfile
# Option 1: Skip submodules
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
# Don't copy api-microservices-sdk

# Option 2: Include submodules
FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY --chown=node:node . .
RUN git submodule update --init --recursive
````

### 4. Deployment Considerations

- Frontend SDK changes don't affect backend deployments
- Frontend teams pull SDK updates independently
- No need to redeploy backend when SDK is updated

## Validation Checklist

- [ ] CI runs successfully without submodule
- [ ] `yarn generate:api` works in CI
- [ ] `yarn generate:sdk` works in CI
- [ ] `yarn generate:frontend-sdk` gracefully skips if directory missing
- [ ] Docker builds work correctly
- [ ] New developer setup is documented

## Security Notes

- Don't use `${{ secrets.GITHUB_TOKEN }}` for pushing to submodules
- Create a Personal Access Token (PAT) with limited scope
- Store as `SDK_UPDATE_TOKEN` in repository secrets
- Limit PAT permissions to only the SDK repository
