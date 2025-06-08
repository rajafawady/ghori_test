DB_NAME="cv-matcher"
DB_USER="postgres"
DB_PASSWORD="6731"

# Check if psql and createdb commands are available
if ! command -v psql &> /dev/null || ! command -v createdb &> /dev/null; then
    echo "Error: PostgreSQL client tools (psql and createdb) are not installed or not in your PATH."
    echo "Please install PostgreSQL and ensure the commands are available in your terminal."
    exit 1
fi


export PGPASSWORD="$DB_PASSWORD"


# Check if the database already exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database $DB_NAME already exists."
else
    # Create the database
    echo "Creating database: $DB_NAME"
    createdb -U $DB_USER $DB_NAME
    echo "Database created successfully."
fi
unset PGPASSWORD
echo "Database setup complete."