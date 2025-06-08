#!/bin/bash
# Run pgTAP tests for CV Matcher database

# Default parameters
DATABASE=${1:-"job_matcher"}
HOST=${2:-"localhost"}
PORT=${3:-"5432"}
USERNAME=${4:-"pgtap_tester"}
PASSWORD=${5:-"pgtap_test_password"}

# Show help if requested
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: $0 [database] [host] [port] [username] [password]"
    echo ""
    echo "Parameters:"
    echo "  database    Database name (default: job_matcher)"
    echo "  host        Database host (default: localhost)"
    echo "  port        Database port (default: 5432)"
    echo "  username    Database username (default: pgtap_tester)"
    echo "  password    Database password (default: pgtap_test_password)"
    exit 0
fi

# Export database connection parameters
export PGDATABASE=$DATABASE
export PGHOST=$HOST
export PGPORT=$PORT
export PGUSER=$USERNAME
export PGPASSWORD=$PASSWORD

# Check if pg_prove is installed
if ! command -v pg_prove &> /dev/null; then
    echo "Error: pg_prove not found. Please install pg_prove before running tests."
    echo "You can install it using: cpan TAP::Parser::SourceHandler::pgTAP"
    exit 1
fi

pg_prove_version=$(pg_prove --version)
echo "Using pg_prove: $pg_prove_version"

# First, ensure pgTAP is installed
echo "Installing pgTAP extension if needed..."
psql -d $DATABASE -U $USERNAME -h $HOST -p $PORT -f "tests/pgtap/setup/install_pgtap.sql" -q

# Define colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define test categories
declare -a CATEGORIES=(
    "Schema Tests:tests/pgtap/schema/*.sql"
    "Function Tests:tests/pgtap/functions/*.sql"
    "RLS Tests:tests/pgtap/rls/*.sql"
    "CRUD Tests:tests/pgtap/crud/*.sql"
    "Integration Tests:tests/pgtap/integration/*.sql"
    "Performance Tests:tests/pgtap/performance/*.sql"
)

# Track totals
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run each category of tests
for category in "${CATEGORIES[@]}"; do
    # Split the category into name and path
    IFS=':' read -r -a array <<< "$category"
    name="${array[0]}"
    path="${array[1]}"
    
    echo -e "\n${GREEN}Running $name...${NC}"
    
    # Find all test files in this category
    test_files=$(ls $path 2>/dev/null)
    
    if [ -z "$test_files" ]; then
        echo -e "  ${YELLOW}No test files found in $path${NC}"
        continue
    fi
    
    # Run each test file
    for test_file in $test_files; do
        echo -e "  ${CYAN}Testing: $(basename "$test_file")${NC}"
        
        # Run the test using pg_prove
        result=$(pg_prove -d $DATABASE -U $USERNAME -h $HOST -p $PORT "$test_file" --verbose)
        exit_status=$?
        
        # Parse results
        if [ $exit_status -eq 0 ]; then
            ((PASSED_TESTS++))
            echo -e "    ${GREEN}✅ PASSED${NC}"
        else
            ((FAILED_TESTS++))
            echo -e "    ${RED}❌ FAILED${NC}"
        fi
        
        ((TOTAL_TESTS++))
        
        # Show the output
        while IFS= read -r line; do
            if [[ $line == *"not ok"* ]]; then
                echo -e "    ${RED}$line${NC}"
            elif [[ $line == "ok "* ]]; then
                echo -e "    ${GREEN}$line${NC}"
            else
                echo "    $line"
            fi
        done <<< "$result"
    done
done

# Show summary
echo -e "\n${BLUE}Test Summary:${NC}"
echo -e "  Total test files: $TOTAL_TESTS"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    exit 0
fi
