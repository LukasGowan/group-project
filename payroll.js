const hoursInput = document.querySelector("#hours");
const rateInput = document.querySelector("#rate");
const resultOutput = document.querySelector("#result");

function updateGrossPay() {
  const hours = Number(hoursInput.value);
  const rate = Number(rateInput.value);
  const grossPay = hours * rate;

  resultOutput.textContent = `Gross pay: $${grossPay.toFixed(2)}`;
}

hoursInput.addEventListener("input", updateGrossPay);
rateInput.addEventListener("input", updateGrossPay);
updateGrossPay();