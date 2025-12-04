#!/bin/bash

# Local development setup script
# Run this after cloning the repository

set -e

echo "🚀 Setting up Botpress Dashboard Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Copy environment file
if [ ! -f .env.local ]; then
    echo ""
    echo "⚙️  Creating .env.local file..."
    cat > .env.local << 'EOF'
# Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=botpress_db
MYSQL_USER=botpress_user
MYSQL_PASSWORD=botpress_password
MYSQL_PORT=3306

# Application
NODE_ENV=development
APP_PORT=3000
DATABASE_URL=mysql://botpress_user:botpress_password@localhost:3306/botpress_db

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this
EOF
    echo "✓ Created .env.local (update with your values)"
else
    echo "✓ .env.local already exists"
fi

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Check if Docker is available for docker-compose
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker is available"
    echo ""
    echo "To start the development environment:"
    echo "  docker-compose up"
    echo ""
    echo "To run migrations:"
    echo "  npx prisma migrate dev"
    echo ""
    echo "To seed the database:"
    echo "  npm run prisma:seed"
else
    echo ""
    echo "⚠️  Docker is not installed. Please install Docker to use docker-compose"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update .env.local with your configuration"
echo "  2. Start containers: docker-compose up"
echo "  3. Run migrations: npx prisma migrate dev"
echo "  4. Start development: npm run dev"
echo "  5. Open http://localhost:3000"
