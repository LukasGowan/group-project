// Name: Eliezer Dorleus
// Group Project - Calendar API Implementation
// This class handles date validation and calendar functions.

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

public class CalendarValidator {

    // Sets the required date format.
    private static final DateTimeFormatter formatter =
            DateTimeFormatter.ofPattern("uuuu-MM-dd")
                    .withResolverStyle(ResolverStyle.STRICT);

    // Checks if the entered date is valid.
    public static boolean validateDate(String date) {
        try {
            LocalDate.parse(date, formatter);
            return true;
        } catch (DateTimeParseException | NullPointerException e) {
            return false;
        }
    }

    // Checks if the date is in the past.
    public static boolean isPastDate(String date) {
        LocalDate enteredDate = LocalDate.parse(date, formatter);
        return enteredDate.isBefore(LocalDate.now());
    }

    // Checks if the year is a leap year.
    public static boolean isLeapYear(int year) {
        return java.time.Year.isLeap(year);
    }

    // Calculates the number of days until an event.
    public static long daysUntilEvent(String date) {
        LocalDate eventDate = LocalDate.parse(date, formatter);
        return ChronoUnit.DAYS.between(LocalDate.now(), eventDate);
    }

    // Main method to test the calendar functions.
    public static void main(String[] args) {

        String testDate = "2026-12-25";

        if (validateDate(testDate)) {

            System.out.println("Date is valid.");

            System.out.println("Past date: "
                    + isPastDate(testDate));

            System.out.println("Days until event: "
                    + daysUntilEvent(testDate));

            System.out.println("Leap year: "
                    + isLeapYear(2026));

        } else {
            System.out.println("Invalid date entered.");
        }
    }
}
