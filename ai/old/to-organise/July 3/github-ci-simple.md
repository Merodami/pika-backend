# GitHub CI/CD - Simple & Bulletproof Implementation

## Overview

A straightforward, production-ready CI/CD setup for the Solo60 monorepo. No over-engineering, just essential workflows that work reliably.

## Core Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `dev` branches.

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: solo60_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Setup Yarn
        run: corepack enable

      - name: Get yarn cache
        id: yarn-cache-dir
        run: echo "dir=$(yarn config get cacheFolder)" >> $GITHUB_OUTPUT

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ${{ steps.yarn-cache-dir.outputs.dir }}
            .yarn/unplugged
            .yarn/install-state.gz
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-

      - name: Cache NX
        uses: actions/cache@v4
        with:
          path: .nx/cache
          key: ${{ runner.os }}-nx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-nx-

      - name: Install dependencies
        run: yarn install --immutable

      - name: Generate Prisma & API
        run: yarn local:generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/solo60_test

      - name: Lint
        run: yarn lint

      - name: Type Check
        run: yarn typecheck

      - name: Build
        run: yarn build

      - name: Test
        run: yarn test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/solo60_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          NODE_ENV: test

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 5
```

### 2. Deploy to Production (`.github/workflows/deploy-prod.yml`)

Triggers only on successful merges to `main`.

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Setup Yarn
        run: corepack enable

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            .yarn/cache
            .yarn/unplugged
            .yarn/install-state.gz
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}

      - name: Install dependencies
        run: yarn install --immutable

      - name: Build
        run: yarn build
        env:
          NODE_ENV: production

      - name: Deploy
        run: |
          echo "Deploy to production here"
          # Add your deployment script
```

### 3. Deploy to Development (`.github/workflows/deploy-dev.yml`)

Triggers on pushes to `dev` branch.

```yaml
name: Deploy Development

on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: development

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'

      - name: Setup Yarn
        run: corepack enable

      - name: Install dependencies
        run: yarn install --immutable

      - name: Build
        run: yarn build
        env:
          NODE_ENV: development

      - name: Deploy
        run: |
          echo "Deploy to development here"
          # Add your deployment script
```

## Required GitHub Secrets

Add these to your repository settings under Settings → Secrets and variables → Actions:

### Essential Secrets

```
# Database
DATABASE_URL

# Authentication
JWT_SECRET
INTERNAL_API_TOKEN

# Redis (if using external)
REDIS_URL

# AWS/S3 (for storage service)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET

# Stripe (for payment service)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### Environment-Specific Variables

Use GitHub Environments to manage different configs for `production` and `development`.

## Local Testing

Test the workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Test CI workflow
act -j ci

# Test with specific event
act pull_request -j ci
```

## Best Practices

### 1. Keep It Simple

- One main CI workflow that does everything
- Separate deployment workflows for each environment
- Use GitHub's built-in features (environments, protection rules)

### 2. Fast Feedback

- Run fastest checks first (lint, typecheck)
- Use service containers instead of Docker Compose
- Cache aggressively but smartly

### 3. Reliable Tests

- Always use fixed versions for service images
- Set proper health checks
- Use environment variables for configuration

### 4. Security

- Use GitHub Environments for secrets
- Never commit sensitive data
- Rotate secrets regularly

## Monitoring

### Branch Protection Rules

For `main` branch:

- Require pull request reviews
- Require status checks to pass (CI workflow)
- Require branches to be up to date
- Include administrators

For `dev` branch:

- Require status checks to pass
- No review required (faster iteration)

### Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/your-org/solo60/workflows/CI/badge.svg)
![Deploy Production](https://github.com/your-org/solo60/workflows/Deploy%20Production/badge.svg)
```

## Troubleshooting

### Common Issues

1. **Yarn cache issues**

   ```yaml
   - name: Clear Yarn cache
     run: yarn cache clean --all
   ```

2. **NX cache issues**

   ```yaml
   - name: Clear NX cache
     run: yarn nx reset
   ```

3. **Prisma binary issues**
   ```yaml
   - name: Generate Prisma
     run: |
       yarn db:generate
       yarn prisma generate --schema=./packages/database/prisma/schema.prisma
   ```

## Next Steps

1. **Add these files to `.github/workflows/`**
2. **Configure GitHub Secrets**
3. **Enable branch protection**
4. **Test with a pull request**

That's it! A simple, standard, bulletproof CI/CD setup that just works.
