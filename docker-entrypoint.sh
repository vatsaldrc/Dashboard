#!/bin/sh
set -e

echo "Generating Prisma Client..."
node_modules/.bin/prisma generate

echo "Starting application..."
exec node server.js
