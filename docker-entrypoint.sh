#!/bin/sh
set -e

echo "Running Prisma migrations..."

# Try to deploy migrations normally
if ! node_modules/.bin/prisma migrate deploy 2>/dev/null; then
  echo "Migration failed, attempting to baseline existing database..."
  
  # Baseline the database with the latest migration
  node_modules/.bin/prisma migrate resolve --applied 20251117112335_update_botpress_analytics_schema
  
  # Try deploy again
  node_modules/.bin/prisma migrate deploy
fi

echo "Generating Prisma Client..."
node_modules/.bin/prisma generate

echo "Starting application..."
exec node server.js
