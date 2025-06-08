<#
.SYNOPSIS
Runs all Node.js/Jest tests for the CV Matcher database

.DESCRIPTION
This script runs all Node.js tests using Jest against the CV Matcher database to validate 
schema integrity, security policies, CRUD operations, integration scenarios, and performance.

.PARAMETER TestType
The type of tests to run: "all", "schema", "crud", "security", "integration", "performance"

.PARAMETER Coverage
Whether to generate test coverage reports. Defaults to false.

.PARAMETER Watch
Whether to run tests in watch mode. Defaults to false.

.EXAMPLE
.\run_tests.ps1

.EXAMPLE
.\run_tests.ps1 -TestType "schema" -Coverage $true

.EXAMPLE
.\run_tests.ps1 -Watch $true
#>

param (
    [string]$TestType = "all",
    [bool]$Coverage = $false,
    [bool]$Watch = $false
)

# Navigate to tests directory (where package.json is located)
$testsDir = Split-Path $PSScriptRoot -Leaf
if ($testsDir -ne "tests") {
    Set-Location $PSScriptRoot
} else {
    # Already in tests directory
}

# Check if Node.js and npm are installed
try {
    $nodeVersion = node --version
    Write-Host "Using Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js before running tests." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "Using npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm not found. Please install npm before running tests." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
Write-Host "Checking dependencies..." -ForegroundColor Cyan
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Build Jest command based on parameters
$jestArgs = @()

# Determine which tests to run based on TestType
switch ($TestType.ToLower()) {
    "schema" {
        $jestArgs += "tests/schema"
        Write-Host "Running Schema Tests..." -ForegroundColor Green
    }
    "crud" {
        $jestArgs += "tests/crud"
        Write-Host "Running CRUD Tests..." -ForegroundColor Green
    }
    "security" {
        $jestArgs += "tests/security"
        Write-Host "Running Security Tests..." -ForegroundColor Green
    }
    "integration" {
        $jestArgs += "tests/integration"
        Write-Host "Running Integration Tests..." -ForegroundColor Green
    }
    "performance" {
        $jestArgs += "tests/performance"
        Write-Host "Running Performance Tests..." -ForegroundColor Green
    }
    "all" {
        Write-Host "Running All Tests..." -ForegroundColor Green
    }
    default {
        Write-Host "Error: Invalid test type '$TestType'. Valid options: all, schema, crud, security, integration, performance" -ForegroundColor Red
        exit 1
    }
}

# Add coverage flag if requested
if ($Coverage) {
    $jestArgs += "--coverage"
    Write-Host "Coverage reporting enabled" -ForegroundColor Cyan
}

# Add watch flag if requested
if ($Watch) {
    $jestArgs += "--watch"
    Write-Host "Watch mode enabled" -ForegroundColor Cyan
}

# Add verbose output
$jestArgs += "--verbose"

# Run Jest tests
Write-Host ""
Write-Host "Executing: npm test $($jestArgs -join ' ')" -ForegroundColor Cyan
$env:NODE_ENV = "test"

if ($jestArgs.Count -gt 0) {
    npm test -- $jestArgs
} else {
    npm test
}

$exitCode = $LASTEXITCODE

# Show results
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
}

exit $exitCode
