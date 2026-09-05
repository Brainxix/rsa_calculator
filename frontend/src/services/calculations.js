// calculations.js
// Mirrors the logic in Django's models.py RSAEquityRequest — runs entirely client-side.

const EQUITY_RATE = 0.25;
const MANAGEMENT_FEE_RATE = 0.02;
const LOAN_WINDOW_MIN = 400000;
const LOAN_ROUNDING_UNIT = 100000;
const REPAYMENT_ANNUAL_RATE = 0.09;
const REPAYMENT_MONTHS = 120;

function calculateEquity(rsaBalance) {
  return Math.round(rsaBalance * EQUITY_RATE * 100) / 100;
}

function calculatePropertyAmount(equity) {
  const n = Math.ceil((equity + LOAN_WINDOW_MIN) / LOAN_ROUNDING_UNIT);
  return n * LOAN_ROUNDING_UNIT;
}

function calculateLoanFacility(propertyAmount, equity) {
  return Math.round((propertyAmount - equity) * 100) / 100;
}

function calculateManagementFee(equity) {
  // truncate down to 2 decimal places
  return Math.floor(equity * MANAGEMENT_FEE_RATE * 100) / 100;
}

function calculateMonthlyRepayment(loanAmount) {
  const r = REPAYMENT_ANNUAL_RATE / 12;
  const n = REPAYMENT_MONTHS;
  const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const monthly = loanAmount * factor;
  return Math.floor(monthly); // truncate to whole naira
}

function toISODate(date) {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
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

/**
 * Runs the full calculation, given the raw form input.
 * Returns an object shaped exactly like the old Django API response,
 * so ResultsPage.jsx needs NO changes.
 */
export function runCalculation(form) {
  const rsaBalance = parseFloat(form.rsa_balance);

  const equity_contribution = calculateEquity(rsaBalance);
  const property_amount = calculatePropertyAmount(equity_contribution);
  const loan_facility_amount = calculateLoanFacility(property_amount, equity_contribution);
  const management_processing_fee = calculateManagementFee(equity_contribution);
  const monthly_repayment = calculateMonthlyRepayment(loan_facility_amount);
  const dates = calculateDates();

  return {
    id: Date.now(), // fake id, since there's no backend to assign one
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