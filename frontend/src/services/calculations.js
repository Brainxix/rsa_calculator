// calculations.js
// Runs entirely client-side. All amounts are whole naira.

const LOAN_WINDOW_MIN = 400000;
const LOAN_ROUNDING_UNIT = 100000;
const REPAYMENT_ANNUAL_RATE = 0.09;
const REPAYMENT_MONTHS = 120;

function calculateEquity(rsaBalance) {
  // 25% = divide by 4, rounded to nearest naira
  return Math.round(rsaBalance / 4);
}

function calculatePropertyAmount(equity) {
  const n = Math.ceil((equity + LOAN_WINDOW_MIN) / LOAN_ROUNDING_UNIT);
  return n * LOAN_ROUNDING_UNIT;
}

function calculateLoanFacility(propertyAmount, equity) {
  return propertyAmount - equity; // both whole numbers
}

function calculateManagementFee(equity) {
  // 2% = divide by 50, rounded to nearest naira
  return Math.round(equity / 50);
}

function calculateMonthlyRepayment(loanAmount) {
  const r = REPAYMENT_ANNUAL_RATE / 12;
  const n = REPAYMENT_MONTHS;
  const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.floor(loanAmount * factor); // truncate to whole naira
}

function toISODate(date) {
  // local date parts, so Nigerian time doesn't slip back a day after midnight
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateDates() {
  const today = new Date();
  const offerLetter = new Date(today);
  offerLetter.setDate(today.getDate() - 7);
  const secondVerification = new Date(today);
  secondVerification.setDate(today.getDate() - 4);

  return {
    statement_date: toISODate(today),
    property_offer_letter_date: toISODate(offerLetter),
    second_verification_date: toISODate(secondVerification),
  };
}

export function runCalculation(form) {
  const rsaBalance = parseFloat(form.rsa_balance);

  const equity_contribution = calculateEquity(rsaBalance);
  const property_amount = calculatePropertyAmount(equity_contribution);
  const loan_facility_amount = calculateLoanFacility(property_amount, equity_contribution);
  const management_processing_fee = calculateManagementFee(equity_contribution);
  const monthly_repayment = calculateMonthlyRepayment(loan_facility_amount);
  const dates = calculateDates();

  return {
    id: Date.now(),
    customer_name: form.customer_name,
    mayfresh_account_number: form.mayfresh_account_number,
    customer_address: form.customer_address,
    rsa_pin: form.rsa_pin,
    rsa_balance: rsaBalance,
    equity_contribution,
    property_amount,
    loan_facility_amount,
    monthly_repayment,
    management_processing_fee,
    is_eligible: rsaBalance > 0,
    ...dates,
    created_at: new Date().toISOString(),
  };
}