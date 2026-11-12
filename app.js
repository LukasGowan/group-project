const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", options);
}

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
    latest = { name, start: fields.start.value, end: fields.end.value, gross, deductions, net };

    output("summary-employee").textContent = name;
    output("employee-initials").textContent = name.split(/\s+/).map((part) => part[0]).join("");
    output("summary-period").textContent = period;
    output("regular-pay").textContent = money.format(regularPay);
    output("overtime-pay").textContent = money.format(overtimePay);
    output("gross-pay").textContent = money.format(gross);
    output("deduction-total").textContent = money.format(deductions);
    output("net-pay").textContent = money.format(net);
    output("history-employee").textContent = name;
    output("history-period").textContent = `${formatDate(fields.start.value)}–${formatDate(fields.end.value)}`;
    output("history-gross").textContent = money.format(gross);
    output("history-deductions").textContent = money.format(deductions);
    output("history-net").textContent = money.format(net);
    output("payroll-status").textContent = "Payroll estimate updated.";
  }

  calculateButton.addEventListener("click", calculate);
  document.querySelector("#print-payslip").addEventListener("click", () => window.print());
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
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payroll-history.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function initializeCalendar() {
  const grid = document.querySelector("#calendar-grid");
  if (!grid) return;

  const monthHeading = document.querySelector("#calendar-month");
  const currentMonthLabel = document.querySelector("#payday-month");
  const paydayDate = document.querySelector("#payday-date");
  const eventForm = document.querySelector("#event-form");
  const eventToggle = document.querySelector("#toggle-event-form");
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  let visibleMonth = new Date(2026, 9, 1);
  let selectedDate = new Date(2026, 9, 15);
  const customEvents = new Map();

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function render() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const firstCell = new Date(year, month, 1 - firstWeekday);

    monthHeading.textContent = monthFormatter.format(visibleMonth);
    currentMonthLabel.textContent = visibleMonth.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const payday = new Date(year, month, 15);
    paydayDate.textContent = payday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    grid.replaceChildren();

    for (let index = 0; index < cellCount; index += 1) {
      const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
      const inMonth = date.getMonth() === month;
      const key = isoDate(date);
      const dayButton = document.createElement("button");
      dayButton.type = "button";
      dayButton.className = `calendar-day${inMonth ? "" : " muted"}${inMonth && key === isoDate(selectedDate) ? " selected" : ""}`;
      dayButton.setAttribute("role", "gridcell");
      dayButton.setAttribute("aria-label", date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }));

      const dayNumber = document.createElement("span");
      dayNumber.textContent = String(date.getDate());
      dayButton.append(dayNumber);

      let note = customEvents.get(key);
      let noteClass = "";
      if (!note && inMonth && date.getDate() === 1) note = "Pay period begins";
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

      if (inMonth) {
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

  document.querySelector("#previous-month").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    render();
  });
  document.querySelector("#next-month").addEventListener("click", () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    render();
  });
  document.querySelector("#today").addEventListener("click", () => {
    visibleMonth = new Date(2026, 9, 1);
    selectedDate = new Date(2026, 9, 15);
    render();
  });
  eventToggle.addEventListener("click", () => {
    eventForm.hidden = !eventForm.hidden;
    eventToggle.setAttribute("aria-expanded", String(!eventForm.hidden));
    eventToggle.textContent = eventForm.hidden ? "+ Add payroll event" : "Close event form";
    if (!eventForm.hidden) document.querySelector("#event-title").focus();
  });
  eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.querySelector("#event-title").value.trim();
    const eventDate = new Date(`${document.querySelector("#event-date").value}T00:00:00`);
    if (!title || Number.isNaN(eventDate.getTime())) return;
    customEvents.set(isoDate(eventDate), title);
    visibleMonth = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
    selectedDate = eventDate;
    eventForm.reset();
    document.querySelector("#event-date").value = isoDate(eventDate);
    eventForm.hidden = true;
    eventToggle.setAttribute("aria-expanded", "false");
    eventToggle.textContent = "+ Add payroll event";
    render();
  });

  render();
}

initializePayroll();
initializeCalendar();
