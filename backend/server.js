
const express = require('express');
const db = require('./db');

const path = require('path');

const app = express();
const PORT = 3000;

// Allow the server to read JSON data
app.use(express.json());

// Serve the payroll website locally
// Only expose approved frontend files
const publicFiles = [
    'index.html',
    'calendar.html',
    'processing.html',
    'app.js',
    'script.js',
    'payroll.js',
    'style.css'
];

for (const file of publicFiles) {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', file));
    });
}

// Open the calendar by default
app.get('/', (req, res) => {
    res.redirect('/calendar.html');
});

console.log('Registering PUT shift route');

 // Update an existing employee shift
app.put('/api/shifts/:id', async (req, res) => {
    try {
        const shiftId = Number(req.params.id);

        const {
            shift_start,
            shift_end,
            break_minutes,
            shift_status
        } = req.body;

        const dateFormat =
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

        // Validate the information
        if (
            !Number.isSafeInteger(shiftId) ||
            shiftId <= 0 ||
            typeof shift_start !== 'string' ||
            typeof shift_end !== 'string' ||
            !dateFormat.test(shift_start) ||
            !dateFormat.test(shift_end) ||
            shift_end <= shift_start ||
            !Number.isInteger(break_minutes) ||
            break_minutes < 0 ||
            !['Scheduled', 'Completed', 'Canceled']
                .includes(shift_status)
        ) {
            return res.status(400).json({
                error: 'Invalid shift information.'
            });
        }

        // Update the shift in MySQL
        const [result] = await db.execute(
            `UPDATE shifts
             SET shift_start = ?,
                 shift_end = ?,
                 break_minutes = ?,
                 shift_status = ?
             WHERE shift_id = ?`,
            [
                shift_start,
                shift_end,
                break_minutes,
                shift_status,
                shiftId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Shift not found.'
            });
        }

        res.json({
            message: 'Shift updated successfully!'
        });

    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({
            error: 'Unable to update shift.'
        });
    }
});

 // DELETE an employee shift
app.delete('/api/shifts/:id', async (req, res) => {
    try {
        const shiftId = Number(req.params.id);

        // Validate the shift ID
        if (!Number.isSafeInteger(shiftId) ||
            shiftId <= 0) {
            return res.status(400).json({
                error: 'Invalid shift ID.'
            });
        }

        // Delete the shift from MySQL
        const [result] = await db.execute(
            'DELETE FROM shifts WHERE shift_id = ?',
            [shiftId]
        );

        // Check whether the shift existed
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Shift not found.'
            });
        }

        res.json({
            message: 'Shift deleted successfully!'
        });

    } catch (error) {
        // Protect shifts with related time records
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                error: 'Shift has related records and cannot be deleted.'
            });
        }

        console.error('Error deleting shift:', error);

        res.status(500).json({
            error: 'Unable to delete shift.'
        });
    }
});

// Test the backend server
app.get('/api/health', (req, res) => {
    res.json({ message: 'Payroll backend is running!' });
});

// Retrieve employee information from MySQL
app.get('/api/employees', async (req, res) => {
    try {
        const [employees] = await db.query(`
            SELECT
                e.employee_id,
                e.first_name,
                e.last_name,
                e.email,
                e.job_title,
                e.department_id,
                e.hire_date,
                    (
                        SELECT p.hourly_rate
                        FROM pay_rates p
                        WHERE p.employee_id = e.employee_id
                        ORDER BY p.effective_date DESC, p.pay_rate_id DESC
                        LIMIT 1
                    ) AS hourly_rate,
                e.employment_status,
                d.department_name
            FROM employees e
            INNER JOIN departments d
                ON e.department_id = d.department_id
            ORDER BY e.last_name
        `);

        res.json(employees);

    } catch (error) {
        console.error('Employee query failed:', error);
        res.status(500).json({
            error: 'Unable to retrieve employees.'
        });
    }
});

 // Retrieve departments from MySQL
app.get('/api/departments', async (req, res) => {
    try {
        const [departments] = await db.query(`
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_name
        `);

        res.json(departments);

    } catch (error) {
        console.error('Error loading departments:', error);

        res.status(500).json({
            error: 'Unable to retrieve departments.'
        });
    }
});

 // Retrieve employee shifts from MySQL
app.get('/api/shifts', async (req, res) => {
    try {
        const [shifts] = await db.query(`
            SELECT
                s.shift_id,
                s.employee_id,
                e.first_name,
                e.last_name,
                s.shift_start,
                s.shift_end,
                s.break_minutes,
                s.shift_status,
                s.calendar_event_id
            FROM shifts s
            INNER JOIN employees e
                ON s.employee_id = e.employee_id
            ORDER BY s.shift_start
        `);

        res.json(shifts);

    } catch (error) {
        console.error('Shift query failed:', error);
        res.status(500).json({
            error: 'Unable to retrieve shifts.'
        });
    }
});

 // Add a new employee and hourly pay rate
app.post('/api/employees', async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        job_title,
        hire_date
    } = req.body;

    const department_id = Number(req.body.department_id);
    const hourly_rate = Number(req.body.hourly_rate);

    // Validate employee information
    if (
        typeof first_name !== 'string' ||
        !first_name.trim() ||
        first_name.length > 50 ||
        typeof last_name !== 'string' ||
        !last_name.trim() ||
        last_name.length > 50 ||
        typeof email !== 'string' ||
        !email.includes('@') ||
        email.length > 100 ||
        typeof job_title !== 'string' ||
        !job_title.trim() ||
        job_title.length > 100 ||
        !Number.isSafeInteger(department_id) ||
        department_id <= 0 ||
        typeof hire_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(hire_date) ||
        !Number.isFinite(hourly_rate) ||
        hourly_rate < 0 ||
        hourly_rate > 99999999.99
    ) {
        return res.status(400).json({
            error: 'Invalid employee information.'
        });
    }

    let connection;

    try {
        // Get a database connection
        connection = await db.getConnection();

        // Start a transaction
        await connection.beginTransaction();

        // Insert the employee
        const [employeeResult] = await connection.execute(
            `INSERT INTO employees
             (first_name, last_name, email,
              job_title, hire_date, department_id,
              employment_status)
             VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
            [
                first_name.trim(),
                last_name.trim(),
                email.trim(),
                job_title.trim(),
                hire_date,
                department_id
            ]
        );

        const employeeId = employeeResult.insertId;

        // Insert the employee's hourly pay rate
        await connection.execute(
            `INSERT INTO pay_rates
             (employee_id, hourly_rate, effective_date)
             VALUES (?, ?, ?)`,
            [employeeId, hourly_rate, hire_date]
        );

        // Save both records together
        await connection.commit();

        res.status(201).json({
            message: 'Employee added successfully!',
            employee_id: employeeId
        });

    } catch (error) {
        // Undo both inserts if anything fails
        if (connection) {
            await connection.rollback();
        }

        console.error('Employee creation failed:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'An employee record conflicts with existing data.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                error: 'The selected department does not exist.'
            });
        }

        res.status(500).json({
            error: 'Unable to add employee.'
        });

    } finally {
        // Release the connection
        if (connection) {
            connection.release();
        }
    }
});

 // Add a new employee shift
app.post('/api/shifts', async (req, res) => {
    try {
        const {
            employee_id,
            shift_start,
            shift_end,
            break_minutes = 0
        } = req.body;

        // Validate shift information
        const dateFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

        if (
            !Number.isInteger(employee_id) ||
            employee_id <= 0 ||
            typeof shift_start !== 'string' ||
            typeof shift_end !== 'string' ||
            !dateFormat.test(shift_start) ||
            !dateFormat.test(shift_end) ||
            shift_end <= shift_start ||
            !Number.isInteger(break_minutes) ||
            break_minutes < 0
        ) {
            return res.status(400).json({
                error: 'Invalid shift information.'
            });
        }

        // Save the new shift to MySQL
        const [result] = await db.execute(
            `INSERT INTO shifts
             (employee_id, shift_start, shift_end,
              break_minutes, shift_status)
             VALUES (?, ?, ?, ?, 'Scheduled')`,
            [
                employee_id,
                shift_start,
                shift_end,
                break_minutes
            ]
        );

        res.status(201).json({
            message: 'Shift added successfully!',
            shift_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding shift:', error);
        res.status(500).json({
            error: 'Unable to add shift.'
        });
    }
});


 // Update an existing employee
app.put('/api/employees/:id', async (req, res) => {
    const employeeId = Number(req.params.id);

    const {
        first_name,
        last_name,
        email,
        job_title,
        hire_date
    } = req.body || {};

    const departmentId = Number(req.body?.department_id);
    const hourlyRate = Number(req.body?.hourly_rate);

    // Validate the submitted information
    if (
        !Number.isSafeInteger(employeeId) ||
        employeeId <= 0 ||
        typeof first_name !== 'string' ||
        !first_name.trim() ||
        first_name.length > 50 ||
        typeof last_name !== 'string' ||
        !last_name.trim() ||
        last_name.length > 50 ||
        typeof email !== 'string' ||
        !email.includes('@') ||
        email.length > 100 ||
        typeof job_title !== 'string' ||
        !job_title.trim() ||
        job_title.length > 100 ||
        typeof hire_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(hire_date) ||
        !Number.isSafeInteger(departmentId) ||
        departmentId <= 0 ||
        !Number.isFinite(hourlyRate) ||
        hourlyRate < 0 ||
        hourlyRate > 99999999.99
    ) {
        return res.status(400).json({
            error: 'Invalid employee information.'
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Update employee information
        const [result] = await connection.execute(
            `UPDATE employees
             SET first_name = ?,
                 last_name = ?,
                 email = ?,
                 job_title = ?,
                 hire_date = ?,
                 department_id = ?
             WHERE employee_id = ?`,
            [
                first_name.trim(),
                last_name.trim(),
                email.trim(),
                job_title.trim(),
                hire_date,
                departmentId,
                employeeId
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: 'Employee not found.'
            });
        }

        // Find the employee's most recent hourly rate
        const [rates] = await connection.execute(
            `SELECT hourly_rate
             FROM pay_rates
             WHERE employee_id = ?
             ORDER BY effective_date DESC, pay_rate_id DESC
             LIMIT 1
             FOR UPDATE`,
            [employeeId]
        );

        // Preserve pay history by adding a new record
        // only when the hourly rate changes
        if (
            rates.length === 0 ||
            Number(rates[0].hourly_rate) !== hourlyRate
        ) {
            await connection.execute(
                `INSERT INTO pay_rates
                 (employee_id, hourly_rate, effective_date)
                 VALUES (?, ?, CURRENT_DATE())`,
                [employeeId, hourlyRate]
            );
        }

        // Save all changes together
        await connection.commit();

        res.json({
            message: 'Employee updated successfully!'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Employee update error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Employee information conflicts with an existing record.'
            });
        }

        res.status(500).json({
            error: 'Unable to update employee.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

 // Deactivate an employee without deleting payroll history
app.patch('/api/employees/:id/deactivate', async (req, res) => {
    const employeeId = Number(req.params.id);

    // Make sure the employee ID is valid
    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({
            error: 'Invalid employee ID.'
        });
    }

    try {
        // Change employee status to Inactive
        const [result] = await db.execute(
            `UPDATE employees
             SET employment_status = ?
             WHERE employee_id = ?`,
            ['Inactive', employeeId]
        );

        // Check whether the employee exists
        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Employee not found.'
            });
        }

        res.json({
            message: 'Employee deactivated successfully!',
            employee_id: employeeId,
            employment_status: 'Inactive'
        });

    } catch (error) {
        console.error('Employee deactivation error:', error);

        res.status(500).json({
            error: 'Unable to deactivate employee.'
        });
    }
});

// Start the local backend server
app.listen(PORT, '127.0.0.1', () => {
    console.log(
        `Payroll server running at http://localhost:${PORT}`
    );
});
