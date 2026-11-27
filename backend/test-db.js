
const db = require('./db');

// Test the connection to the payroll database
async function testConnection() {
    try {
        // Retrieve employees from MySQL
        const [rows] = await db.query(
            'SELECT employee_id, first_name, last_name FROM employees'
        );

        console.log('MySQL connected successfully!');
        console.table(rows);

    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exitCode = 1;

    } finally {
        // Close database connections
        await db.end();
    }
}

// Run the connection test
testConnection();
