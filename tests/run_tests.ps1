<#
.SYNOPSIS
Runs all pgTAP tests for the CV Matcher database

.DESCRIPTION
This script runs all pgTAP tests against the CV Matcher database to validate 
schema integrity, RLS policies, CRUD operations, and integration scenarios.

.PARAMETER Database
The name of the database to test. Defaults to "job_matcher".

.PARAMETER HostName 
The database server hostname. Defaults to "localhost".

.PARAMETER Port
The database server port. Defaults to 5432.

.PARAMETER Username
The database username. Defaults to "pgtap_tester".

.PARAMETER Password
The database password. Defaults to "pgtap_test_password".

.EXAMPLE
.\run_tests.ps1

.EXAMPLE
.\run_tests.ps1 -Database "job_matcher_test" -Username "postgres" -Password "mysecret"
#>

param (
    [string]$Database = "job_matcher",
    [string]$HostName = "localhost",
    [string]$Port = "5432",
    [string]$Username = "pgtap_tester",
    [SecureString]$Password = (ConvertTo-SecureString "pgtap_test_password" -AsPlainText -Force)
)

# Set environment variables for pg_prove
$env:PGDATABASE = $Database
$env:PGHOST = $HostName
$env:PGPORT = $Port
$env:PGUSER = $Username
$env:PGPASSWORD = (New-Object PSCredential "user", $Password).GetNetworkCredential().Password

# Check if pg_prove is installed
try {
    $pgProveVersion = pg_prove --version
    Write-Host "Using pg_prove: $pgProveVersion"
} catch {
    Write-Host "Error: pg_prove not found. Please install pg_prove before running tests."
    Write-Host "You can install it using: cpan TAP::Parser::SourceHandler::pgTAP"
    exit 1
}

# Get the script directory for reliable path resolution
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# First, ensure pgTAP is installed
Write-Host "Installing pgTAP extension if needed..." -ForegroundColor Cyan
psql -d $Database -U $Username -h $HostName -p $Port -f "$scriptDir\pgtap\setup\install_pgtap.sql" -q

# Define test categories
$testCategories = @(
    @{Name = "Schema Tests"; Path = "$scriptDir\pgtap\schema\*.sql"},
    @{Name = "Function Tests"; Path = "$scriptDir\pgtap\functions\*.sql"},
    @{Name = "RLS Tests"; Path = "$scriptDir\pgtap\rls\*.sql"},
    @{Name = "CRUD Tests"; Path = "$scriptDir\pgtap\crud\*.sql"},
    @{Name = "Integration Tests"; Path = "$scriptDir\pgtap\integration\*.sql"},
    @{Name = "Performance Tests"; Path = "$scriptDir\pgtap\performance\*.sql"}
)

# Run each category of tests
$totalTests = 0
$passedTests = 0
$failedTests = 0

foreach ($category in $testCategories) {
    Write-Host ""
    Write-Host "Running $($category.Name)..." -ForegroundColor Green
      # Find all test files in this category
    $testFiles = Get-ChildItem -Path $category.Path -ErrorAction SilentlyContinue
    
    if ($testFiles.Count -eq 0) {
        Write-Host "  No test files found in $($category.Path)" -ForegroundColor Yellow
        continue
    }
    
    # Run each test file
    foreach ($testFile in $testFiles) {
        Write-Host "  Testing: $($testFile.Name)" -ForegroundColor Cyan
        
        # Run the test using pg_prove
        $result = pg_prove -d $Database -U $Username -h $HostName -p $Port $testFile.FullName --verbose
        
        # Parse results
        if ($LASTEXITCODE -eq 0) {
            $passedTests++
            Write-Host "    ✅ PASSED" -ForegroundColor Green
        } else {
            $failedTests++
            Write-Host "    ❌ FAILED" -ForegroundColor Red
        }
        
        $totalTests++
        
        # Show the output
        $result | ForEach-Object {
            if ($_ -match "not ok") {
                Write-Host "    $_" -ForegroundColor Red
            } elseif ($_ -match "^ok") {
                Write-Host "    $_" -ForegroundColor Green
            } else {
                Write-Host "    $_" -ForegroundColor Gray
            }
        }
    }
}

# Show summary
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Blue
Write-Host "  Total test files: $totalTests" -ForegroundColor White
Write-Host "  Passed: $passedTests" -ForegroundColor Green
Write-Host "  Failed: $failewwdTests" -ForegroundColor Red

if ($failedTests -gt 0) {
    exit 1
} else {
    exit 0
}
