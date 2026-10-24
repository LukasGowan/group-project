# Payroll Management System
## Database Design Documentation

### 1. Project Overview

The Payroll Management System is designed to help businesses manage employee information, work schedules, hours worked, and payroll processing.

The database was created using MySQL Workbench and consists of eight relational tables. These tables work together to store employee records, track scheduled and actual work hours, calculate payroll information, and manage paycheck deductions.

The database also supports the application's planned calendar integration by storing employee schedules and external calendar event identifiers.

### 2. Database Tables

The Payroll Management System contains the following eight tables:

| Table Name | Description |
|---|---|
| departments | Stores department names and descriptions. |
| employees | Stores employee names, contact information, job titles, hire dates, and employment status. |
| pay_rates | Stores employee hourly wages and effective dates to maintain pay history. |
| shifts | Stores scheduled employee shifts, including start times, end times, breaks, and calendar event identifiers. |
| time_entries | Records employee clock-in times, clock-out times, and actual unpaid breaks. |
| pay_periods | Stores payroll start dates, end dates, payment dates, and processing status. |
| paychecks | Stores employee payroll records, including regular hours, overtime hours, and gross pay. |
| paycheck_deductions | Records deductions associated with employee paychecks, including taxes, insurance,

### 4. Primary Keys and Foreign Keys

The Payroll Management System uses primary keys
and foreign keys to connect related tables and
maintain referential integrity.

A primary key uniquely identifies each record
within a table.

A foreign key establishes a relationship between
two tables by referencing another table's
primary key.

#### Primary Keys

| Table | Primary Key |
|---|---|
| departments | department_id |
| employees | employee_id |
| pay_rates | pay_rate_id |
| shifts | shift_id |
| time_entries | time_entry_id |
| pay_periods | pay_period_id |
| paychecks | paycheck_id |
| paycheck_deductions | deduction_id |

#### Foreign Key Relationships

| Table | Foreign Key | References |
|---|---|---|
| employees | department_id | departments |
| pay_rates | employee_id | employees |
| shifts | employee_id | employees |
| time_entries | shift_id | shifts |
| paychecks | employee_id | employees |
| paychecks | pay_period_id | pay_periods |
| paycheck_deductions | paycheck_id | paychecks |

#### Referential Integrity

Referential integrity ensures that relationships
between tables remain valid.

For example, an employee cannot be assigned to
a department that does not exist in the
departments table.

Similarly, a paycheck must reference an existing
employee and pay period.

Foreign key constraints help prevent orphaned
records and maintain database consistency.


### 5. Database Relationships

The Payroll Management System uses relationships
between tables to organize employee, scheduling,
and payroll information.

#### One-to-Many Relationships

1. Departments to Employees

One department can have multiple employees.
Each employee belongs to one department.

2. Employees to Pay Rates

One employee can have multiple pay rate records.
This allows the system to maintain a history
of employee wage changes.

3. Employees to Shifts

One employee can have multiple scheduled shifts.
Each shift belongs to one employee.

4. Employees to Paychecks

One employee can have multiple paychecks.
Each paycheck belongs to one employee.

5. Pay Periods to Paychecks

One pay period can contain multiple paychecks.
Each paycheck belongs to one pay period.

6. Paychecks to Paycheck Deductions

One paycheck can have multiple deductions.
Each deduction belongs to one paycheck.

#### One-to-One Relationship

Shifts to Time Entries

Each shift can have zero or one time entry,
and each time entry belongs to exactly one shift.

The UNIQUE constraint on time_entries.shift_id
prevents multiple time entries from being
assigned to the same shift.

#### Calendar Integration

The shifts table includes a calendar_event_id
column that can store the identifier of an
event created using an external calendar API.

This allows the application to associate
employee schedules with calendar events.

The calendar API integration will be implemented
through the application backend.

#### Entity Relationship Diagram

The ER diagram was created using MySQL Workbench
and illustrates the eight tables, primary keys,
foreign keys, and relationships.

Files:
- Payroll_Management_ER_Diagram.png
- Payroll_Management_ER_Diagram.mwb


### 6. Database Normalization (3NF)

The Payroll Management System database was
designed using relational database normalization
principles to reduce unnecessary data duplication
and maintain data integrity.

#### First Normal Form (1NF)

First Normal Form requires each table to have
uniquely identifiable records and individual
columns containing atomic values.

Our database supports 1NF by:
- Using primary keys for all eight tables.
- Storing individual employee details in
  separate columns.
- Keeping multiple paycheck deductions
  as separate records.

For example, employee first and last names
are stored in separate columns.

#### Second Normal Form (2NF)

Second Normal Form requires the database to
satisfy 1NF and have no partial dependencies
on a composite candidate key.

All eight tables use single-column primary keys,
and their other candidate keys must also be
considered when checking dependencies.

For example, employee pay rates are stored
in a separate table rather than repeating
pay rate history in employee records.

#### Third Normal Form (3NF)

Third Normal Form requires the database to
satisfy 2NF and avoid transitive dependencies
between non-key attributes.

The database separates information into
related tables to support 3NF.

Examples include:

1. Department names and descriptions are stored
   in departments, not repeated in employees.

2. Hourly pay rates and their effective dates
   are stored in pay_rates.

3. Employee work schedules are stored in shifts,
   while actual clock-in and clock-out times
   are stored in time_entries.

4. Payroll dates are stored in pay_periods
   instead of being repeated in paychecks.

5. Paycheck deductions are stored separately
   from the paychecks table.

#### Stored Payroll Calculations

The paychecks table stores regular hours,
overtime hours, and gross pay.

These values are intended to represent
payroll calculation results for a specific
employee and pay period.

Storing payroll results can preserve historical
payroll information, but the application must
ensure the saved values remain consistent
with the calculations used to produce them.

A complete 3NF review should also verify
functional dependencies and candidate keys
throughout the database.

#### Benefits of Normalization

Normalization helps the Payroll Management
System by:

- Reducing unnecessary data duplication.
- Improving data consistency.
- Simplifying employee information updates.
- Maintaining valid relationships.
- Supporting reliable payroll reporting.


### 7. SQL Operations and Payroll Calculations

The Payroll Management System uses SQL queries
to manage employee records, retrieve payroll
information, and generate payroll reports.

All SQL queries were developed and tested
using MySQL Workbench.

The queries are saved in payroll_queries.sql.

#### Create, Read, Update, and Delete (CRUD)

The database supports the four basic CRUD
operations:

- CREATE: INSERT statements add employees,
  departments, schedules, and payroll records.

- READ: SELECT statements retrieve employee,
  scheduling, and payroll information.

- UPDATE: UPDATE statements modify existing
  records, such as employee job titles.

- DELETE: DELETE statements remove records
  when appropriate.

The UPDATE and DELETE examples were tested
using temporary data and transaction controls.

#### Employee Search and Sorting

SQL queries allow employee records to be
searched and sorted.

The LIKE operator searches employee names,
while ORDER BY sorts the results.

These queries provide the database logic
needed for application search and sorting.

#### SQL JOIN Operations

JOIN operations combine information from
related tables.

For example, the employees, departments,
and pay_rates tables can be joined to display
an employee's name, department, job title,
and hourly pay rate.

Additional JOIN queries retrieve employee
schedules and paycheck information.

#### Payroll Calculations

The database supports calculations for
employee paid hours, gross pay, deductions,
and net pay.

Paid Hours =
(Clock-Out Time - Clock-In Time)
- Unpaid Break Time

For the basic sample records:

Gross Pay = Paid Hours * Hourly Rate

Net Pay = Gross Pay - Total Deductions

The current test data uses regular hours
without overtime.

Actual overtime calculations and tax
withholding rules must be implemented
and tested separately.

#### Sample Payroll Results

The database contains three fictional
employee records used for testing.

| Employee | Gross Pay | Deductions | Net Pay |
|---|---:|---:|---:|
| Jordan Smith | $187.50 | $35.00 | $152.50 |
| Sarah Johnson | $138.75 | $12.00 | $126.75 |
| Michael Brown | $210.00 | $45.00 | $165.00 |
| Total | $536.25 | $92.00 | $444.25 |

The deductions are fictional test amounts
and do not represent actual tax withholding.

#### Aggregate Functions

The database includes aggregate queries
using the following SQL functions:

- COUNT(): Counts employees and paychecks.
- SUM(): Calculates total payroll amounts.
- AVG(): Calculates average wages and pay.
- MIN(): Identifies the lowest hourly wage.
- MAX(): Identifies the highest hourly wage.
- GROUP BY: Groups records for reports.

These functions help generate reports
for employee management and payroll.

#### SQL Testing

The following operations were successfully
tested using MySQL Workbench:

1. Creating eight database tables.
2. Inserting fictional employee records.
3. Updating employee information.
4. Deleting temporary test records.
5. Searching and sorting employees.
6. Joining multiple related tables.
7. Calculating paid hours and gross pay.
8. Calculating deductions and net pay.
9. Generating aggregate payroll reports.
10. Verifying foreign key relationships.

The SQL queries demonstrate database
functionality. The application interface
and backend integration require separate
implementation and testing.

#### SQL Project Files

- payroll_database.sql
  Contains database structure and sample data.

- payroll_queries.sql
  Contains SQL searches, JOINs, calculations,
  reports, and CRUD examples.


### 8. Calendar API Integration

#### Overview

The Payroll Management System is designed to
support an external calendar API for employee
scheduling and payroll management.

The calendar integration will allow employees
and managers to view scheduled work shifts
through a calendar interface.

The external API connection is a planned
application feature and has not yet been
implemented or tested.

#### Database Calendar Support

The shifts table stores the information needed
for employee scheduling.

Important fields include:

- shift_id: Unique identifier for each shift.
- employee_id: Identifies the assigned employee.
- shift_start: Scheduled starting date and time.
- shift_end: Scheduled ending date and time.
- break_minutes: Scheduled unpaid break time.
- shift_status: Current scheduling status.
- calendar_event_id: Identifier of an external
  calendar event.

#### Planned Calendar API Workflow

1. A manager creates an employee work schedule
   through the payroll application.

2. The application saves the scheduled shift
   in the MySQL shifts table.

3. The backend sends the schedule information
   to the external calendar API.

4. The calendar API creates an event and returns
   an event identifier.

5. The application stores this identifier in
   the calendar_event_id column.

6. The employee schedule can then be displayed
   through the connected calendar.

7. When a shift is updated or canceled, the
   backend can synchronize those changes
   with the external calendar.

#### Calendar and Payroll Integration

The calendar functionality manages scheduled
work shifts.

The time_entries table separately records
actual employee clock-in and clock-out times.

The payroll system uses actual recorded hours
rather than scheduled calendar hours when
calculating employee pay.

This separation improves payroll accuracy.

#### Integration Considerations

The application backend will need to:

- Authenticate with the selected calendar API.
- Handle calendar event creation and updates.
- Manage dates and time zones consistently.
- Prevent duplicate calendar events.
- Protect employee scheduling information.
- Handle API failures and synchronization errors.

#### Current Development Status

The MySQL database structure supports the
planned calendar integration.

The external API provider, backend connection,
and synchronization features must be confirmed
and implemented by the development team.

The calendar integration will require
additional testing before the application
is considered complete.
