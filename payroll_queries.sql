
-- Payroll Management System
-- SQL Queries
-- Employee Search and Sorting

USE payroll_project_dev;

-- Query 1: Display all employees
-- with their department and job title

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.job_title,
    d.department_name,
    e.employment_status
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id
ORDER BY e.last_name ASC;

-- Query 2: Search employees by last name

SELECT
    employee_id,
    first_name,
    last_name,
    job_title
FROM employees
WHERE last_name LIKE '%Smith%'
ORDER BY last_name ASC;



-- Query 3: Display employees with
-- their departments and hourly pay rates

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.job_title,
    d.department_name,
    p.hourly_rate
FROM employees e
INNER JOIN departments d
    ON e.department_id = d.department_id
INNER JOIN pay_rates p
    ON e.employee_id = p.employee_id
WHERE p.effective_date = (
    SELECT MAX(p2.effective_date)
    FROM pay_rates p2
    WHERE p2.employee_id = e.employee_id
      AND p2.effective_date <= CURRENT_DATE()
)
ORDER BY e.last_name ASC;


-- Query 4: Display employee work schedules
-- with employee names and departments

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name,
    s.shift_start,
    s.shift_end,
    s.break_minutes,
    s.shift_status,
    s.calendar_event_id
FROM shifts s
INNER JOIN employees e
    ON s.employee_id = e.employee_id
INNER JOIN departments d
    ON e.department_id = d.department_id
ORDER BY s.shift_start, e.last_name;


-- Query 5: Display employee payroll calculations
-- including hours, gross pay, deductions, and net pay

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    pp.period_start,
    pp.period_end,
    p.regular_hours,
    p.overtime_hours,
    p.regular_hours + p.overtime_hours
        AS total_paid_hours,
    p.gross_pay,
    COALESCE(d.total_deductions, 0)
        AS total_deductions,
    p.gross_pay -
        COALESCE(d.total_deductions, 0)
        AS net_pay
FROM paychecks p
INNER JOIN employees e
    ON p.employee_id = e.employee_id
INNER JOIN pay_periods pp
    ON p.pay_period_id = pp.pay_period_id
LEFT JOIN (
    SELECT
        paycheck_id,
        SUM(deduction_amount) AS total_deductions
    FROM paycheck_deductions
    GROUP BY paycheck_id
) d
    ON p.paycheck_id = d.paycheck_id
ORDER BY pp.period_start, e.last_name;


-- Query 6: Payroll Summary Report
-- Calculate total payroll expenses by pay period

SELECT
    pp.pay_period_id,
    pp.period_start,
    pp.period_end,
    COUNT(p.paycheck_id) AS total_paychecks,
    COALESCE(SUM(p.gross_pay), 0)
        AS total_gross_pay,
    COALESCE(SUM(d.total_deductions), 0)
        AS total_deductions,
    COALESCE(SUM(
        p.gross_pay -
        COALESCE(d.total_deductions, 0)
    ), 0) AS total_net_pay,
    COALESCE(ROUND(AVG(p.gross_pay), 2), 0)
        AS average_gross_pay
FROM pay_periods pp
LEFT JOIN paychecks p
    ON pp.pay_period_id = p.pay_period_id
LEFT JOIN (
    SELECT
        paycheck_id,
        SUM(deduction_amount) AS total_deductions
    FROM paycheck_deductions
    GROUP BY paycheck_id
) d
    ON p.paycheck_id = d.paycheck_id
GROUP BY
    pp.pay_period_id,
    pp.period_start,
    pp.period_end
ORDER BY pp.period_start DESC;


-- Query 7: UPDATE and DELETE Examples
-- Demonstrates changing and deleting records
-- without permanently modifying the database.

START TRANSACTION;

-- Insert a temporary test department
INSERT INTO departments
(department_name, description)
VALUES
('SQL Demo Department', 'Temporary test record');

-- UPDATE: Change the department description
UPDATE departments
SET description = 'Updated department information'
WHERE department_name = 'SQL Demo Department';

-- Verify the UPDATE
SELECT *
FROM departments
WHERE department_name = 'SQL Demo Department';

-- DELETE: Remove the temporary department
DELETE FROM departments
WHERE department_name = 'SQL Demo Department';

-- Verify the DELETE
SELECT *
FROM departments
WHERE department_name = 'SQL Demo Department';

-- Undo the transaction to preserve original data
ROLLBACK;
