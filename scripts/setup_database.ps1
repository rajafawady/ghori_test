$DB_NAME = "cv-matcher"
$DB_USER = "postgres"
$DB_PASSWORD = "6731"

# Check if psql command is available
try {
    $null = Get-Command psql -ErrorAction Stop
}
catch {
    Write-Error "Error: PostgreSQL client tools (psql) are not installed or not in your PATH."
    Write-Error "Please install PostgreSQL and ensure the commands are available in your terminal."
    exit 1
}

# Set environment variable for password
$env:PGPASSWORD = $DB_PASSWORD

# Check if the database already exists
$dbExists = psql -U $DB_USER -lqt | Select-String -Pattern "\s$DB_NAME\s" -Quiet

if ($dbExists) {
    Write-Host "Database $DB_NAME already exists."
}
else {
    # Create the database
    Write-Host "Creating database: $DB_NAME"
    createdb -U $DB_USER $DB_NAME
    Write-Host "Database created successfully."
}

# Remove password environment variable
Remove-Item Env:\PGPASSWORD

Write-Host "Database setup complete."
