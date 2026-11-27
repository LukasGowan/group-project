
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




// Start the local backend server
app.listen(PORT, '127.0.0.1', () => {
    console.log(
        `Payroll server running at http://localhost:${PORT}`
    );
});
