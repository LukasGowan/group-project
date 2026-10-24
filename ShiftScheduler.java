// Name: Eliezer Dorleus
// Group Project - Shift Scheduling System
// This class adds and displays employee shifts.

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

public class ShiftScheduler {

    // Adds a new employee shift to the database.
    public static void addShift(
            Connection connection,
            int employeeId,
            String shiftDate,
            String startTime,
            String endTime) throws SQLException {

        // Checks if the employee ID is valid.
        if (employeeId <= 0) {
            System.out.println("Invalid employee ID.");
            return;
        }

        // Checks if the date entered is valid.
        if (!CalendarValidator.validateDate(shiftDate)) {
            System.out.println("Invalid shift date.");
            return;
        }

        // Prevents scheduling shifts in the past.
        if (CalendarValidator.isPastDate(shiftDate)) {
            System.out.println("Cannot schedule shifts in the past.");
            return;
        }

        try {

            // Converts the entered times into Java time objects.
            LocalTime start = LocalTime.parse(startTime);
            LocalTime end = LocalTime.parse(endTime);

            // Makes sure the ending time is after the starting time.
            if (!end.isAfter(start)) {
                System.out.println("End time must be after start time.");
                return;
            }

            // Checks if the employee already has an overlapping shift.
            String checkSql =
                    "SELECT COUNT(*) FROM shifts " +
                    "WHERE employee_id = ? " +
                    "AND shift_date = ? " +
                    "AND start_time < ? " +
                    "AND end_time > ?";

            try (PreparedStatement check =
                    connection.prepareStatement(checkSql)) {

                check.setInt(1, employeeId);
                check.setDate(2,
                        java.sql.Date.valueOf(shiftDate));
                check.setTime(3,
                        java.sql.Time.valueOf(end));
                check.setTime(4,
                        java.sql.Time.valueOf(start));

                try (ResultSet result = check.executeQuery()) {

                    if (result.next() && result.getInt(1) > 0) {
                        System.out.println(
                                "Employee already has a shift during this time.");
                        return;
                    }
                }
            }

            // SQL statement to insert a new shift.
            String sql =
                    "INSERT INTO shifts " +
                    "(employee_id, shift_date, start_time, end_time) " +
                    "VALUES (?, ?, ?, ?)";

            // Prepares the SQL statement.
            try (PreparedStatement statement =
                    connection.prepareStatement(sql)) {

                statement.setInt(1, employeeId);

                statement.setDate(2,
                        java.sql.Date.valueOf(shiftDate));

                statement.setTime(3,
                        java.sql.Time.valueOf(start));

                statement.setTime(4,
                        java.sql.Time.valueOf(end));

                // Saves the shift to the SQL database.
                statement.executeUpdate();

                System.out.println("Shift added successfully.");
            }

        } catch (DateTimeParseException e) {

            System.out.println(
                    "Invalid time format. Use HH:mm.");
        }
    }

    // Displays all scheduled employee shifts.
    public static void viewShifts(
            Connection connection) throws SQLException {

        String sql =
                "SELECT * FROM shifts " +
                "ORDER BY shift_date, start_time";

        try (PreparedStatement statement =
                connection.prepareStatement(sql);

             ResultSet result = statement.executeQuery()) {

            while (result.next()) {

                System.out.println("----------------------");

                System.out.println("Shift ID: " +
                        result.getInt("shift_id"));

                System.out.println("Employee ID: " +
                        result.getInt("employee_id"));

                System.out.println("Date: " +
                        result.getDate("shift_date"));

                System.out.println("Start Time: " +
                        result.getTime("start_time"));

                System.out.println("End Time: " +
                        result.getTime("end_time"));

                System.out.println("Status: " +
                        result.getString("shift_status"));
            }
        }
    }
}
