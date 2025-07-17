#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Determine the script's own directory ---
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# SCRIPT_DIR will be the absolute path to 'packages/tests/src/scripts'

# --- Configuration ---
# Define the output path for the final init.sql file
# It should be: packages/tests/src/utils/dump/init.sql
# Relative to SCRIPT_DIR: ../utils/dump
INIT_SQL_DIR="$SCRIPT_DIR/../utils/dump"
INIT_SQL_FILE="$INIT_SQL_DIR/init.sql"
TEMP_INIT_SQL_FILE="$INIT_SQL_DIR/init.sql.tmp" # Temporary file for pg_dump output

echo "🔄 Starting test database dump generation..."
echo "   Script executing from: $SCRIPT_DIR"
echo "   Target output directory: $INIT_SQL_DIR"
echo "   Target final init.sql file: $INIT_SQL_FILE"
echo "   Temporary dump file: $TEMP_INIT_SQL_FILE"

# Ensure the output directory exists
mkdir -p "$INIT_SQL_DIR"
echo "   Ensured directory exists: $INIT_SQL_DIR"

# --- Check for DATABASE_URL ---
if [ -z "$DATABASE_URL" ]; then
  echo "🔴 ERROR: DATABASE_URL environment variable is not set."
  echo "   This script should be called via 'yarn db:generate-test-dump' which uses dotenv-cli."
  exit 1
fi
echo "   Using DATABASE_URL from environment."

# --- Generate the schema-only dump into a temporary file ---
echo "   1. Running pg_dump (schema-only) to $TEMP_INIT_SQL_FILE..."

# Try using Docker with matching PostgreSQL version to avoid version mismatch
if command -v docker &> /dev/null; then
  echo "   Using Docker with PostgreSQL 17 to avoid version mismatch..."
  docker run --rm --network host \
    -v "$INIT_SQL_DIR:/dump" \
    postgres:17 pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --file="/dump/init.sql.tmp" \
    -d "$DATABASE_URL"
else
  # Fallback to local pg_dump
  echo "   Docker not available, using local pg_dump..."
  pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --file="$TEMP_INIT_SQL_FILE" \
    -d "$DATABASE_URL"
fi
echo "   pg_dump completed. Exit code: $?"

if [ ! -f "$TEMP_INIT_SQL_FILE" ]; then
    echo "🔴 ERROR: pg_dump did not create the temporary file: $TEMP_INIT_SQL_FILE"
    exit 1
elif [ ! -s "$TEMP_INIT_SQL_FILE" ]; then
    echo "⚠️ WARNING: pg_dump created an empty temporary file: $TEMP_INIT_SQL_FILE. Check pg_dump output or DB connection."
    # Depending on desired behavior, you might want to exit 1 here too.
fi


# --- Post-process the dump to comment out problematic DROP EXTENSION and DROP SCHEMA lines ---
echo "   2. Post-processing $TEMP_INIT_SQL_FILE to comment out specific DROP statements..."
echo "      Outputting to $INIT_SQL_FILE"

sed \
  -e 's/^DROP EXTENSION IF EXISTS postgis;/-- DROP EXTENSION IF EXISTS postgis;/' \
  -e 's/^DROP EXTENSION IF EXISTS postgis_topology;/-- DROP EXTENSION IF EXISTS postgis_topology;/' \
  -e 's/^DROP EXTENSION IF EXISTS postgis_tiger_geocoder;/-- DROP EXTENSION IF EXISTS postgis_tiger_geocoder;/' \
  -e 's/^DROP EXTENSION IF EXISTS fuzzystrmatch;/-- DROP EXTENSION IF EXISTS fuzzystrmatch;/' \
  -e 's/^DROP SCHEMA IF EXISTS topology;/-- DROP SCHEMA IF EXISTS topology;/' \
  -e 's/^DROP SCHEMA IF EXISTS tiger_data;/-- DROP SCHEMA IF EXISTS tiger_data;/' \
  -e 's/^DROP SCHEMA IF EXISTS tiger;/-- DROP SCHEMA IF EXISTS tiger;/' \
  -e 's/^CREATE SCHEMA tiger;/-- CREATE SCHEMA tiger;/' \
  -e 's/^CREATE SCHEMA tiger_data;/-- CREATE SCHEMA tiger_data;/' \
  -e 's/^CREATE SCHEMA topology;/-- CREATE SCHEMA topology;/' \
  -e "s/^COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';/-- COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';/" \
  "$TEMP_INIT_SQL_FILE" > "$INIT_SQL_FILE"
echo "   sed processing completed. Exit code: $?"


# Clean up the temporary file
if [ -f "$TEMP_INIT_SQL_FILE" ]; then
  rm "$TEMP_INIT_SQL_FILE"
  echo "   Cleaned up temporary file: $TEMP_INIT_SQL_FILE"
else
  echo "   Temporary file $TEMP_INIT_SQL_FILE was not found for cleanup (might indicate an earlier error)."
fi


if [ -f "$INIT_SQL_FILE" ] && [ -s "$INIT_SQL_FILE" ]; then
  echo "✅ Test database dump generated and processed successfully at $INIT_SQL_FILE"
else
  echo "🔴 ERROR: Final $INIT_SQL_FILE was not created or is empty."
  exit 1
fi