-- Name: Eliezer Dorleus
-- Group Project - Shift Scheduling System
-- This table stores employee work shifts.

CREATE TABLE IF NOT EXISTS shifts (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_status VARCHAR(20) DEFAULT 'Scheduled'
);
