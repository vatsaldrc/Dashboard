#!/bin/bash

# Deployment Script for Portainer via SSH
# This script automates the deployment process

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Portainer Deployment...${NC}"

# Variables (set these before running)
DEPLOY_SERVER="${DEPLOY_SERVER:-}"
DEPLOY_USER="${DEPLOY_USER:-}"
DEPLOY_PATH="${DEPLOY_PATH:-}"
SSH_KEY="${SSH_PRIVATE_KEY:-}"

# Validate variables
if [ -z "$DEPLOY_SERVER" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PATH" ]; then
    echo -e "${RED}Error: Missing environment variables${NC}"
    echo "Required: DEPLOY_SERVER, DEPLOY_USER, DEPLOY_PATH"
    exit 1
fi

# Create SSH key file from base64
if [ ! -z "$SSH_KEY" ]; then
    mkdir -p ~/.ssh
    echo "$SSH_KEY" | base64 -d > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    SSH_OPTION="-i ~/.ssh/deploy_key"
else
    SSH_OPTION=""
fi

# SSH command
SSH_CMD="ssh $SSH_OPTION -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER}"

echo -e "${YELLOW}Connecting to ${DEPLOY_USER}@${DEPLOY_SERVER}...${NC}"

# Execute deployment steps
$SSH_CMD << 'DEPLOY_SCRIPT'
    set -e
    
    echo "Entering deployment directory..."
    cd ${DEPLOY_PATH:=/home/deploy/botpress}
    
    echo "Pulling latest docker-compose configuration..."
    git pull origin main || echo "Git pull failed, continuing with existing compose file..."
    
    echo "Pulling latest Docker images..."
    docker-compose pull
    
    echo "Starting services..."
    docker-compose up -d
    
    echo "Running database migrations..."
    docker-compose exec -T app npx prisma migrate deploy || true
    
    echo "Cleaning up unused Docker resources..."
    docker system prune -f
    
    echo "Displaying running containers..."
    docker ps
    
    echo ""
    echo "Deployment completed successfully!"
DEPLOY_SCRIPT

echo -e "${GREEN}✓ Deployment completed!${NC}"

# Cleanup
[ -f ~/.ssh/deploy_key ] && rm ~/.ssh/deploy_key

exit 0
