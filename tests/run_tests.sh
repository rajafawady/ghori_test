#!/bin/bash
# Run Node.js/Jest tests for the CV Matcher database

# Default parameters
TEST_TYPE=${1:-"all"}
COVERAGE=${2:-false}
WATCH=${3:-false}

# Show help if requested
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: $0 [test_type] [coverage] [watch]"
    echo ""
    echo "Parameters:"
    echo "  test_type   Type of tests to run: all, schema, crud, security, integration, performance (default: all)"
    echo "  coverage    Generate coverage report: true/false (default: false)"
    echo "  watch       Run in watch mode: true/false (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                          # Run all tests"
    echo "  $0 schema true              # Run schema tests with coverage"
    echo "  $0 integration false true   # Run integration tests in watch mode"
    exit 0
fi

# Navigate to tests directory (where package.json is located)
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install Node.js before running tests."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm not found. Please install npm before running tests."
    exit 1
fi

node_version=$(node --version)
npm_version=$(npm --version)
echo "Using Node.js: $node_version"
echo "Using npm: $npm_version"

# Check if dependencies are installed
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Define colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build Jest command based on parameters
JEST_ARGS=""

# Determine which tests to run based on TEST_TYPE
case "${TEST_TYPE,,}" in
    "schema")
        JEST_ARGS="tests/schema"
        echo -e "${GREEN}Running Schema Tests...${NC}"
        ;;
    "crud")
        JEST_ARGS="tests/crud"
        echo -e "${GREEN}Running CRUD Tests...${NC}"
        ;;
    "security")
        JEST_ARGS="tests/security"
        echo -e "${GREEN}Running Security Tests...${NC}"
        ;;
    "integration")
        JEST_ARGS="tests/integration"
        echo -e "${GREEN}Running Integration Tests...${NC}"
        ;;
    "performance")
        JEST_ARGS="tests/performance"
        echo -e "${GREEN}Running Performance Tests...${NC}"
        ;;
    "all")
        echo -e "${GREEN}Running All Tests...${NC}"
        ;;
    *)
        echo -e "${RED}Error: Invalid test type '$TEST_TYPE'. Valid options: all, schema, crud, security, integration, performance${NC}"
        exit 1
        ;;
esac

# Add coverage flag if requested
if [ "${COVERAGE,,}" == "true" ]; then
    JEST_ARGS="$JEST_ARGS --coverage"
    echo -e "${CYAN}Coverage reporting enabled${NC}"
fi

# Add watch flag if requested
if [ "${WATCH,,}" == "true" ]; then
    JEST_ARGS="$JEST_ARGS --watch"
    echo -e "${CYAN}Watch mode enabled${NC}"
fi

# Add verbose output
JEST_ARGS="$JEST_ARGS --verbose"

# Run Jest tests
echo ""
echo -e "${CYAN}Executing: npm test $JEST_ARGS${NC}"
export NODE_ENV=test

if [ -n "$JEST_ARGS" ]; then
    npm test -- $JEST_ARGS
else
    npm test
fi

exit_code=$?

# Show results
echo ""
if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed!${NC}"
fi

exit $exit_code
