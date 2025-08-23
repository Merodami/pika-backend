# Complete Database Removal Process

## Date: 2025-08-23

### Overview

This document outlines the process used to completely remove the database, including Docker containers, volumes, and local database files.

## Step 1: Stop Running Services

```bash
yarn kill
```

This command kills all running Vitest and Node processes to ensure no services are actively using the database.

## Step 2: Identify Running Containers

```bash
docker ps -a | grep -E "(postgres|redis|pika)"
```

Found the following containers:

- `pika_postgres` - PostgreSQL database container
- `pika_redis` - Redis cache container
- `pika_minio` - MinIO storage (left running as not database-related)
- `pika_stripe_mock` - Stripe mock (left running as not database-related)
- `pika_mailhog` - Mail service (left running as not database-related)

## Step 3: Stop and Remove Database Containers

```bash
docker stop pika_postgres pika_redis
docker rm pika_postgres pika_redis
```

Successfully stopped and removed both database containers.

## Step 4: Remove Docker Volumes

```bash
# List volumes
docker volume ls | grep pika

# Remove Redis data volume
docker volume rm pika_redis_data
```

Removed the Redis data volume. PostgreSQL was using bind mount to local directory.

## Step 5: Delete Local Database Files

```bash
# Remove local PostgreSQL and Redis data directories
rm -rf .local/data/postgres
rm -rf .local/data/redis

# Remove NX workspace database files
rm -f .nx/workspace-data/*.db
```

### Locations of Removed Files:

- `.local/data/postgres/` - PostgreSQL data files
- `.local/data/redis/` - Redis persistence files
- `.nx/workspace-data/*.db` - NX workspace cache database

## Step 6: Verification

```bash
# Verify containers are removed
docker ps -a | grep -E "(postgres|redis)"

# Verify local files are removed
ls -la .local/data/
```

## Result

Successfully removed:

- All database Docker containers (PostgreSQL, Redis)
- All Docker volumes for database storage
- All local database files in `.local/data/`
- NX workspace database cache

## To Recreate Database

To set up a fresh database after this removal:

```bash
# Start Docker containers
yarn docker:local

# Generate Prisma client from schema
yarn db:generate

# Deploy existing migrations to database
yarn db:migrate:deploy

# For creating new migrations (if schema changed)
yarn db:migrate:local

# Seed database with test data (optional)
yarn db:seed
```

### Command Explanations:

- `yarn db:generate` - Generates Prisma client from the schema files
- `yarn db:migrate:deploy` - Applies all existing migrations to the database
- `yarn db:migrate:local` - Creates new migrations for any schema changes (development only)
- `yarn db:seed` - Populates database with sample data

## Troubleshooting: NX Cache Issues

If you encounter NX cache errors after database removal, such as:

```
NX   Unable to set journal_mode: DB pragma update error: SqliteFailure(Error { code: SystemIoFailure, extended_code: 522 }, Some("disk I/O error"))
```

### Solution: Clear NX Cache

```bash
# Remove entire NX cache directory
rm -rf .nx/

# Clear node_modules cache
rm -rf node_modules/.cache/

# Reset NX workspace
npx nx reset
```

This will:

- Remove all NX workspace data and cache
- Clear any corrupted database files
- Reset the NX daemon
- Allow NX to recreate its workspace configuration

## Notes

- The `.local/data/minio/` directory was preserved as it contains object storage data
- Other non-database containers (Stripe mock, Mailhog) were left running
- The `.env.local` file was preserved as it contains configuration, not data
