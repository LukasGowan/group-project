const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Format dates for payroll and calendar displays.
function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", options);
}

// Existing payroll functionality.
function initializePayroll() {
  const calculateButton = document.querySelector("#calculate-payroll");
  if (!calculateButton) return;

  const fields = {
    start: document.querySelector("#period-start"),
    end: document.querySelector("#period-end"),
    regularHours: document.querySelector("#regular-hours"),
    overtimeHours: document.querySelector("#overtime-hours"),
    hourlyRate: document.querySelector("#hourly-rate"),
    deductions: document.querySelector("#deductions"),
    employee: document.querySelector("#employee"),
  };

  const output = (id) => document.querySelector(`#${id}`);
  let latest = null;

  function calculate() {
if (Object.values(fields).some((field) => !field.reportValidity())) return;
    const [name] = fields.employee.value.split("|");
    const regularPay = Number(fields.regularHours.value) * Number(fields.hourlyRate.value);
    const overtimePay = Number(fields.overtimeHours.value) * Number(fields.hourlyRate.value) * 1.5;
    const gross = regularPay + overtimePay;
    const deductions = Number(fields.deductions.value);
    const net = gross - deductions;
    const period = `${formatDate(fields.start.value)} – ${formatDate(fields.end.value)}`;

    latest = {
      name,
      start: fields.start.value,
      end: fields.end.value,
      gross,
      deductions,
      net,
    };

    output("summary-employee").textContent = name;
    output("employee-initials").textContent = name
      .split(/\s+/)
      .map((part) => part[0])
      .join("");

    output("summary-period").textContent = period;
    output("regular-pay").textContent = money.format(regularPay);
    output("overtime-pay").textContent = money.format(overtimePay);
    output("gross-pay").textContent = money.format(gross);
    output("deduction-total").textContent = money.format(deductions);
    output("net-pay").textContent = money.format(net);

    output("history-employee").textContent = name;
    output("history-period").textContent =
      `${formatDate(fields.start.value)}–${formatDate(fields.end.value)}`;
    output("history-gross").textContent = money.format(gross);
    output("history-deductions").textContent = money.format(deductions);
    output("history-net").textContent = money.format(net);
    output("payroll-status").textContent = "Payroll estimate updated.";
  }

  calculateButton.addEventListener("click", calculate);

  document.querySelector("#print-payslip").addEventListener("click", () => {
    window.print();
  });

  document.querySelector("#export-csv").addEventListener("click", () => {
    if (!latest) calculate();
    if (!latest) return;

    const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;

    const rows = [
      ["Employee", "Pay period", "Gross pay", "Deductions", "Net pay"],
      [
        latest.name,
        `${formatDate(latest.start)}–${formatDate(latest.end)}`,
        latest.gross.toFixed(2),
        latest.deductions.toFixed(2),
        latest.net.toFixed(2),
      ],
    ];

    const blob = new Blob(
      [rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "payroll-history.csv";
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

// Calendar and employee shift scheduling.
function initializeCalendar() {
  const grid = document.querySelector("#calendar-grid");
  if (!grid) return;

  const monthHeading = document.querySelector("#calendar-month");
  const currentMonthLabel = document.querySelector("#payday-month");
  const paydayDate = document.querySelector("#payday-date");
  const paydayDay = document.querySelector(".date-tile strong");

  const eventForm = document.querySelector("#event-form");
  const eventToggle = document.querySelector("#toggle-event-form");

  const shiftForm = document.querySelector("#shift-form");
  const shiftToggle = document.querySelector("#toggle-shift-form");

  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Browser storage keys for the classroom demonstration.
  const SHIFTS_KEY = "paydesk_employee_shifts";
  const EVENTS_KEY = "paydesk_payroll_events";

  function loadSavedData(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.warn(`Unable to load ${key}:`, error);
      return fallback;
    }
  }

  let employeeShifts = loadSavedData(SHIFTS_KEY, []);
  let savedEvents = loadSavedData(EVENTS_KEY, {});

  if (!Array.isArray(employeeShifts)) employeeShifts = [];
  if (!savedEvents || typeof savedEvents !== "object" || Array.isArray(savedEvents)) {
    savedEvents = {};
  }

  const customEvents = new Map(Object.entries(savedEvents));

  // GOOGLE CALENDAR API INTEGRATION
  // Replace this placeholder with your restricted Google Cloud API key.
  const GOOGLE_CALENDAR_API_KEY = "PASTE_YOUR_RESTRICTED_API_KEY_HERE";

  // Public U.S. holidays calendar.
  const HOLIDAY_CALENDAR_ID = "en.usa#holiday@group.v.calendar.google.com";

  const holidayCache = new Map();
  const holidayRequests = new Set();

  // Retrieve public holidays from Google Calendar.
  async function loadHolidays(year, month) {
    if (GOOGLE_CALENDAR_API_KEY === "PASTE_YOUR_RESTRICTED_API_KEY_HERE") {
      return;
    }

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (holidayCache.has(monthKey) || holidayRequests.has(monthKey)) {
      return;
    }

    holidayRequests.add(monthKey);

    const first = new Date(Date.UTC(year, month, 1));
    const afterLast = new Date(Date.UTC(year, month + 1, 1));

    const params = new URLSearchParams({
      key: GOOGLE_CALENDAR_API_KEY,
      timeMin: first.toISOString(),
      timeMax: afterLast.toISOString(),
      singleEvents: "true",
      maxResults: "250",
      fields: "items(summary,start),nextPageToken",
    });

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(HOLIDAY_CALENDAR_ID)}/events?${params}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Google Calendar API returned ${response.status}`);
      }

      const data = await response.json();
      const holidays = new Map();

      for (const item of data.items || []) {
        const date = item.start?.date || item.start?.dateTime?.slice(0, 10);

        if (date && item.summary) {
          const names = holidays.get(date) || [];
          names.push(item.summary);
          holidays.set(date, names);
        }
      }

      holidayCache.set(monthKey, holidays);

      if (
        visibleMonth.getFullYear() === year &&
        visibleMonth.getMonth() === month
      ) {
        render();
      }
    } catch (error) {
      console.error("Unable to load public holidays:", error);
    } finally {
      holidayRequests.delete(monthKey);
    }
  }

  function saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Unable to save calendar data:", error);
      alert("Your browser could not save the information.");
      return false;
    }
  }

  function isoDate(date) {
    return (
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, "0")}-` +
      `${String(date.getDate()).padStart(2, "0")}`
    );
  }

  // Reject impossible dates, such as February 30.
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00`);

    return (
      !Number.isNaN(date.getTime()) &&
      isoDate(date) === value
    );
  }

  function getShiftsForDate(date) {
    return employeeShifts
      .filter((shift) => shift.date === date && shift.status !== "Cancelled")
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  // Check whether the employee already has an overlapping shift.
  function hasShiftConflict(employeeId, date, start, end) {
    return employeeShifts.some((shift) => {
      return (
        shift.employeeId === employeeId &&
        shift.date === date &&
        shift.status !== "Cancelled" &&
        start < shift.end &&
        end > shift.start
      );
    });
  }

  function render() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    const holidays = holidayCache.get(monthKey);

    // Load holidays when the calendar month changes.
    void loadHolidays(year, month);

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const firstCell = new Date(year, month, 1 - firstWeekday);

    monthHeading.textContent = monthFormatter.format(visibleMonth);

    currentMonthLabel.textContent = visibleMonth
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();

    const payday = new Date(year, month, 15);

    paydayDate.textContent = payday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (paydayDay) paydayDay.textContent = "15";

    grid.replaceChildren();

    for (let index = 0; index < cellCount; index += 1) {
      const date = new Date(
        firstCell.getFullYear(),
        firstCell.getMonth(),
        firstCell.getDate() + index
      );

      const inMonth = date.getMonth() === month;
      const key = isoDate(date);

      const dayButton = document.createElement("button");
      dayButton.type = "button";

      dayButton.className =
        `calendar-day${inMonth ? "" : " muted"}` +
        `${inMonth && key === isoDate(selectedDate) ? " selected" : ""}`;

      dayButton.setAttribute("role", "gridcell");

      dayButton.setAttribute(
        "aria-label",
        date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );

      const dayNumber = document.createElement("span");
      dayNumber.textContent = String(date.getDate());
      dayButton.append(dayNumber);

      // Existing payroll event labels.
      let note = customEvents.get(key);
      let noteClass = "";

      if (!note && inMonth && date.getDate() === 1) {
        note = "Pay period begins";
      }

      if (!note && inMonth && date.getDate() === 14) {
        note = "Timesheets due";
        noteClass = "warning";
      }

      if (!note && inMonth && date.getDate() === 15) {
        note = "Payday";
        noteClass = "payday";
      }

      if (note) {
        const label = document.createElement("small");
        label.className = noteClass;
        label.textContent = note;
        dayButton.append(label);
      }

      // GOOGLE CALENDAR API: Display U.S. holidays.
      if (inMonth && holidays?.has(key)) {
        for (const holidayName of holidays.get(key)) {
          const holidayLabel = document.createElement("small");

          holidayLabel.className = "calendar-holiday";
          holidayLabel.textContent = `Holiday: ${holidayName}`;

          dayButton.append(holidayLabel);
        }
      }

      // Display saved employee shifts beneath payroll events.
      if (inMonth) {
        const dayShifts = getShiftsForDate(key);

        dayShifts.forEach((shift) => {
          const shiftLabel = document.createElement("small");

          shiftLabel.className = "employee-shift";
          shiftLabel.textContent =
            `Emp ${shift.employeeId}: ${shift.start}–${shift.end}`;

          dayButton.append(shiftLabel);
        });

        dayButton.addEventListener("click", () => {
          selectedDate = date;
          render();
        });
      } else {
        dayButton.disabled = true;
      }

      grid.append(dayButton);
    }
  }

  // Existing calendar navigation.
  document.querySelector("#previous-month").addEventListener("click", () => {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1
    );

    render();
  });

  document.querySelector("#next-month").addEventListener("click", () => {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1
    );

    render();
  });

  document.querySelector("#today").addEventListener("click", () => {
    const currentDate = new Date();

    visibleMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    selectedDate = currentDate;
    render();
  });

  // Existing payroll event form.
  eventToggle.addEventListener("click", () => {
    eventForm.hidden = !eventForm.hidden;

    eventToggle.setAttribute(
      "aria-expanded",
      String(!eventForm.hidden)
    );

    eventToggle.textContent = eventForm.hidden
      ? "+ Add payroll event"
      : "Close event form";

    if (!eventForm.hidden) {
      document.querySelector("#event-title").focus();
    }
  });

  eventForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.querySelector("#event-title").value.trim();
    const dateValue = document.querySelector("#event-date").value;

    if (!title || !validDate(dateValue)) {
      alert("Please enter a valid payroll event.");
      return;
    }

    const eventDate = new Date(`${dateValue}T00:00:00`);

    const updatedEvents = Object.fromEntries(customEvents);
    updatedEvents[dateValue] = title;

    if (!saveData(EVENTS_KEY, updatedEvents)) return;

    customEvents.set(dateValue, title);

    visibleMonth = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      1
    );

    selectedDate = eventDate;

    eventForm.reset();
    document.querySelector("#event-date").value = dateValue;

    eventForm.hidden = true;
    eventToggle.setAttribute("aria-expanded", "false");
    eventToggle.textContent = "+ Add payroll event";

    render();
  });

  // Employee shift scheduling.
  if (shiftForm && shiftToggle) {
    // calendar.html already handles opening and closing the form.

    shiftForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const employeeId = document
        .querySelector("#shift-employee")
        .value.trim();

      const shiftDate = document.querySelector("#shift-date").value;
      const startTime = document.querySelector("#shift-start").value;
      const endTime = document.querySelector("#shift-end").value;
      const shiftStatus = document.querySelector("#shift-status").value;

      if (!/^[1-9]\d*$/.test(employeeId)) {
        alert("Enter a valid positive employee ID.");
        return;
      }

      if (!validDate(shiftDate)) {
        alert("Enter a valid shift date.");
        return;
      }

      if (!startTime || !endTime) {
        alert("Enter both the start and end times.");
        return;
      }

      // This demonstration supports same-day shifts only.
      if (endTime <= startTime) {
        alert("End time must be later than start time.");
        return;
      }

      if (
        shiftStatus !== "Cancelled" &&
        hasShiftConflict(employeeId, shiftDate, startTime, endTime)
      ) {
        alert(
          "Scheduling conflict: this employee already has a shift during that time."
        );
        return;
      }

      const newShift = {
        id: Date.now(),
        employeeId,
        date: shiftDate,
        start: startTime,
        end: endTime,
        status: shiftStatus,
      };

      const updatedShifts = [...employeeShifts, newShift];

      if (!saveData(SHIFTS_KEY, updatedShifts)) return;

      employeeShifts = updatedShifts;

      const savedDate = new Date(`${shiftDate}T00:00:00`);

      visibleMonth = new Date(
        savedDate.getFullYear(),
        savedDate.getMonth(),
        1
      );

      selectedDate = savedDate;

      shiftForm.reset();
      shiftForm.hidden = true;
      shiftToggle.setAttribute("aria-expanded", "false");

      render();

      alert("Employee shift saved successfully!");
    });
  }

  render();
}

initializePayroll();
initializeCalendar();
