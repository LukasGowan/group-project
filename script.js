
document.addEventListener('DOMContentLoaded', () => {

    // Open the Employees page
    const employeesButton = document.querySelector(
        '[data-page="employees"]'
    );

    employeesButton.addEventListener('click', () => {
        document.getElementById('dashboardPage')
            .classList.remove('active');

        document.getElementById('employeesPage')
            .classList.add('active');

        document.getElementById('pageCrumb')
            .textContent = 'Employees';

        document.querySelectorAll('.nav-link')
            .forEach(button => {
                button.classList.remove('active');
            });

        employeesButton.classList.add('active');

        loadEmployees();
    });

    // Retrieve employee records from MySQL
    async function loadEmployees() {
        try {
            const response = await fetch('/api/employees');

            if (!response.ok) {
                throw new Error('Unable to load employees');
            }

            const employees = await response.json();

            const table = document.getElementById(
                'employeeTable'
            );

            table.replaceChildren();

            // Display each employee in the table
            employees.forEach(employee => {
                const row = table.insertRow();

                row.dataset.employeeId = String(employee.employee_id);

                const values = [
                    `${employee.first_name} ${employee.last_name}`,
                    employee.department_name,
                    employee.job_title,
                    employee.hourly_rate != null
                        ? `$${Number(employee.hourly_rate).toFixed(2)}`
                        : '—',
                    employee.employment_status || 'Unknown',
                    ''
                ];

                values.forEach(value => {
                    const cell = row.insertCell();
                    cell.textContent = value ?? '—';
                });

        // Create an Edit button for this employee
        const actionsCell = row.cells[5];

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.className = 'secondary-button';

        // Remember which employee was selected
        editButton.dataset.employeeId = employee.employee_id;


editButton.addEventListener('click', () => {
    // Remember which employee is being edited
    document.getElementById('editEmployeeId').value =
        employee.employee_id;

    // Update the form title
    document.getElementById('dialogTitle').textContent =
        'Edit employee';

    // Fill the form with existing employee information
    document.getElementById('employeeName').value =
        `${employee.first_name} ${employee.last_name}`;

    document.getElementById('employeeEmail').value =
        employee.email;

    document.getElementById('employeeHireDate').value =
        employee.hire_date;

    document.getElementById('employeeDepartment').value =
        String(employee.department_id);

    document.getElementById('employeePosition').value =
        employee.job_title;

    // We will load the hourly rate in a later step
    document.getElementById('employeeHourlyRate').value =
        employee.hourly_rate ?? '';

    // Prevent saving until the Update API is connected
    employeeForm.querySelector('button[type="submit"]').disabled = false;

    // Open the employee form
    employeeDialog.showModal();
});


        actionsCell.appendChild(editButton);

        // Add a Deactivate button for active employees
        if (employee.employment_status === 'Active') {
            const deactivateButton = document.createElement('button');

            deactivateButton.type = 'button';
            deactivateButton.textContent = 'Deactivate';
            deactivateButton.className = 'secondary-button';
            deactivateButton.style.marginLeft = '8px';

            deactivateButton.addEventListener('click', async () => {
                // Confirm before changing employee status
                const confirmed = confirm(
                    `Are you sure you want to deactivate ` +
                    `${employee.first_name} ${employee.last_name}?`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/employees/${employee.employee_id}/deactivate`,
                        { method: 'PATCH' }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.error || 'Unable to deactivate employee.'
                        );
                    }

                    await loadEmployees();

                    alert('Employee deactivated successfully!');

                } catch (error) {
                    console.error('Deactivation error:', error);
                    alert(error.message);
                }
            });

            actionsCell.appendChild(deactivateButton);
        }


            });

            document.getElementById('employeeCount')
                .textContent =
                `${employees.length} employees`;

            document.getElementById('employeeSearch')
                .dispatchEvent(new Event('input'));

            console.log('Employees loaded from MySQL!');

        } catch (error) {
            console.error('Employee loading error:', error);
            alert('Unable to retrieve employee records.');
        }
    }

    // Load departments from MySQL
    async function loadDepartments() {
        try {
            const response = await fetch('/api/departments');

            if (!response.ok) {
                throw new Error('Unable to load departments');
            }

            const departments = await response.json();

            // Find the Department dropdown
            const departmentSelect =
                document.getElementById('employeeDepartment');

            // Clear existing options
            departmentSelect.replaceChildren(
                new Option('Select a Department', '')
            );

            // Add departments from MySQL
            departments.forEach(department => {
                const option = new Option(
                    department.department_name,
                    String(department.department_id)
                );

                departmentSelect.add(option);
            });

            console.log('Departments loaded from MySQL!');

        } catch (error) {
            console.error('Department loading error:', error);
        }
    }

    // Load departments when the website opens
    loadDepartments();

    // Open the Add Employee form
    const addEmployeeButton =
        document.getElementById('addEmployeeButton');

    const employeeDialog =
        document.getElementById('employeeDialog');

    const employeeForm =
        document.getElementById('employeeForm');

    addEmployeeButton.addEventListener('click', () => {
        // Reset the form for a new employee
        employeeForm.reset();
        employeeForm.querySelector('button[type="submit"]').disabled = false;

        document.getElementById('editEmployeeId').value = '';
        document.getElementById('dialogTitle').textContent =
            'Add employee';

        // Open the employee form
        employeeDialog.showModal();
    });

    // Close the form using the X button
    document.getElementById('closeDialog')
        .addEventListener('click', () => {
            employeeDialog.close();
        });

    // Close the form using Cancel
    document.getElementById('cancelDialog')
        .addEventListener('click', () => {
            employeeDialog.close();
        });


    // Save a new employee to MySQL
    employeeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Collect employee information from the form
        const fullName = document
            .getElementById('employeeName')
            .value.trim();

        const nameParts = fullName.split(/\s+/);

        if (nameParts.length < 2) {
            alert('Please enter a first and last name.');
            return;
        }

        const firstName = nameParts.shift();
        const lastName = nameParts.join(' ');

        const employeeData = {
            first_name: firstName,
            last_name: lastName,
            email: document
                .getElementById('employeeEmail').value.trim(),
            hire_date: document
                .getElementById('employeeHireDate').value,
            department_id: Number(document
                .getElementById('employeeDepartment').value),
            job_title: document
                .getElementById('employeePosition').value.trim(),
            hourly_rate: Number(document
                .getElementById('employeeHourlyRate').value)
        };

        try {
            // Send employee information to the backend

            const employeeId =
                document.getElementById('editEmployeeId').value;

            const response = await fetch(
                employeeId ? `/api/employees/${employeeId}` : '/api/employees',
                {
                method: employeeId ? 'PUT' : 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || 'Unable to save employee.'
                );
            }

            // Close the form and refresh the roster
            employeeDialog.close();
            employeeForm.reset();

            await loadEmployees();

            alert(
                employeeId
                    ? 'Employee updated successfully!'
                    : 'Employee added successfully!'
            );

        } catch (error) {
            console.error('Employee saving error:', error);
            alert(error.message);
        }
    });

    // Search employees by name, department, or ID
    const employeeSearch =
        document.getElementById('employeeSearch');

    employeeSearch.addEventListener('input', () => {
        // Get the text entered in the search box
        const searchText = employeeSearch.value
            .trim()
            .toLowerCase();

        // Find the employee roster
        const rows = document.getElementById('employeeTable').rows;

        // Check each employee
        for (const row of rows) {
            const employeeName =
                row.cells[0].textContent.toLowerCase();

            const department =
                row.cells[1].textContent.toLowerCase();

            const employeeId =
                row.dataset.employeeId || '';

            // Match the name, department, or ID
            const matches =
                employeeName.includes(searchText) ||
                department.includes(searchText) ||
                employeeId.includes(searchText);

            // Show matching employees and hide others
            row.style.display = matches ? '' : 'none';
        }

        // Count how many employees match the search
        const visibleCount = Array.from(rows).filter(
            row => row.style.display !== 'none'
        ).length;

        // Update the employee count
        document.getElementById('employeeCount').textContent =
            `${visibleCount} employee${visibleCount === 1 ? '' : 's'}`;

    });

});