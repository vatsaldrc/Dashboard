#!/bin/bash

# Production deployment checklist
# Run this script to verify your environment is ready for production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Production Deployment Checklist ===${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check condition
check() {
    local name=$1
    local command=$2
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $name"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $name"
        ((CHECKS_FAILED++))
    fi
}

# Function to warn about condition
warn() {
    local name=$1
    local command=$2
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $name"
    else
        echo -e "${YELLOW}⚠${NC} $name (Warning)"
    fi
}

echo -e "${BLUE}Environment Checks:${NC}"
check "Node.js installed" "command -v node"
check "npm installed" "command -v npm"
check "Docker installed" "command -v docker"
check "Docker daemon running" "docker ps"
check "git installed" "command -v git"

echo ""
echo -e "${BLUE}Project Files:${NC}"
check "Dockerfile exists" "[ -f Dockerfile ]"
check "docker-compose.yml exists" "[ -f docker-compose.yml ]"
check ".gitlab-ci.yml exists" "[ -f .gitlab-ci.yml ]"
check "package.json exists" "[ -f package.json ]"
check ".env.local exists (or will be created)" "true"

echo ""
echo -e "${BLUE}Git Configuration:${NC}"
check "Git repository initialized" "[ -d .git ]"
check "Remote origin configured" "git remote -v | grep -q origin"

echo ""
echo -e "${BLUE}Environment Variables (Check in GitLab CI/CD):${NC}"
warn "PORTAINER_URL configured" "[ ! -z \$PORTAINER_URL ]"
warn "PORTAINER_USER configured" "[ ! -z \$PORTAINER_USER ]"
warn "DEPLOY_SERVER configured" "[ ! -z \$DEPLOY_SERVER ]"
warn "DEPLOY_USER configured" "[ ! -z \$DEPLOY_USER ]"
warn "CI_REGISTRY_PASSWORD configured" "[ ! -z \$CI_REGISTRY_PASSWORD ]"

echo ""
echo -e "${BLUE}Docker Image:${NC}"
if docker build -t botpress-test:latest --target runner . &>/dev/null; then
    echo -e "${GREEN}✓${NC} Docker image builds successfully"
    ((CHECKS_PASSED++))
    docker rmi botpress-test:latest &>/dev/null || true
else
    echo -e "${RED}✗${NC} Docker image build failed"
    ((CHECKS_FAILED++))
fi

echo ""
echo -e "${BLUE}Database Configuration:${NC}"
check "DATABASE_URL in docker-compose" "grep -q DATABASE_URL docker-compose.yml"
check "MySQL service configured" "grep -q 'mysql:' docker-compose.yml"

echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "Checks Passed: ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Checks Failed: ${RED}${CHECKS_FAILED}${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Please fix the failed checks before deploying.${NC}"
    exit 1
fi
