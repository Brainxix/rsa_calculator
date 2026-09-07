import { useState } from "react";

import "./ResultsPage.css";

/* ---------- Helpers ---------- */

function ordinalSuffix(day) {
  if (day > 3 && day < 21) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatDateLong(dateStr) {
  // dateStr comes from Django as "YYYY-MM-DD"
  if (!dateStr) return "—";

  const [year, month, day] = dateStr
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${months[date.getMonth()]} ${date.getDate()}${ordinalSuffix(
    date.getDate()
  )}, ${date.getFullYear()}`;
}

function formatNaira(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return (
    "₦" +
    Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  );
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function threeDigitsToWords(n) {
  let str = "";

  if (n >= 100) {
    str +=
      ONES[Math.floor(n / 100)] +
      " Hundred ";

    n %= 100;
  }

  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + " ";

    n %= 10;
  }

  if (n > 0) {
    str += ONES[n] + " ";
  }

  return str.trim();
}

function numberToWords(num) {
  num = Math.round(Number(num));

  if (num === 0) {
    return "Zero Naira Only";
  }

  const billions = Math.floor(
    num / 1_000_000_000
  );

  const millions = Math.floor(
    (num % 1_000_000_000) / 1_000_000
  );

  const thousands = Math.floor(
    (num % 1_000_000) / 1_000
  );

  const remainder = num % 1_000;

  let parts = [];

  if (billions) {
    parts.push(
      threeDigitsToWords(billions) +
        " Billion"
    );
  }

  if (millions) {
    parts.push(
      threeDigitsToWords(millions) +
        " Million"
    );
  }

  if (thousands) {
    parts.push(
      threeDigitsToWords(thousands) +
        " Thousand"
    );
  }

  if (remainder) {
    parts.push(
      threeDigitsToWords(remainder)
    );
  }

  return parts.join(" ") + " Naira Only";
}

/* ---------- Copy button ---------- */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        String(text)
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        1500
      );
    } catch {
      // clipboard not available; fail silently
    }
  };

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={handleCopy}
      title="Copy"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

/* ---------- Field rows ---------- */

function FieldRow({ label, value }) {
  return (
    <div className="field-block">
      <label>{label}</label>

      <div className="field-value-row">
        <div className="field-value">
          {value}
        </div>

        <CopyButton text={value} />
      </div>
    </div>
  );
}

function FinancialRow({ label, amount }) {
  return (
    <div className="field-block">
      <label>{label}</label>

      <div className="field-value-row">
        <div className="field-value">
          {formatNaira(amount)}
        </div>

        <CopyButton
          text={formatNaira(amount)}
        />
      </div>

      <div className="field-value-row words-row">
        <div className="field-words">
          {numberToWords(amount)}
        </div>

        <CopyButton
          text={numberToWords(amount)}
        />
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */

export default function ResultsPage({
  result,
  onNewCalculation,
  onViewAll,
}) {
  return (
    <div className="card results-page">
      <div className="results-header">
        <h2>
          RSA Equity Contribution Calculator
        </h2>
      </div>

      <div className="results-section">
        <FieldRow
          label="Date on Mayfresh Mortgage Bank Statement of Account, Date for the Mortgage Offer, First Date on the Verification of Property Offer, PMI Indemnity, Confirmation of Property Availability, Confirmation of Property Title, Expression of Readiness to Disburse"
          value={formatDateLong(
            result.statement_date
          )}
        />

        <FieldRow
          label="Date on the Property Offer Letter"
          value={formatDateLong(
            result.property_offer_letter_date
          )}
        />

        <FieldRow
          label="Second Date of Verification of Property Offer, Valuation Report, Legal Search"
          value={formatDateLong(
            result.second_verification_date
          )}
        />
      </div>

      <div className="results-grid customer-grid">
        <FieldRow
          label="Customer Name"
          value={result.customer_name}
        />

        <FieldRow
          label="Mayfresh Account Number"
          value={
            result.mayfresh_account_number
          }
        />

        <FieldRow
          label="RSA PIN"
          value={result.rsa_pin}
        />

        <FieldRow
          label="Customer Address"
          value={result.customer_address}
        />
      </div>

      <div className="results-section financial-section">
        <h3 className="section-title">
          FINANCIAL BREAKDOWN
        </h3>

        <div className="results-grid">
          <FinancialRow
            label="Property Amount (₦)"
            amount={result.property_amount}
          />

          <FinancialRow
            label="Loan / Facility Amount (₦)"
            amount={
              result.loan_facility_amount
            }
          />

          <FinancialRow
            label="25% / Equity Contribution (₦)"
            amount={
              result.equity_contribution
            }
          />

          <FinancialRow
            label="Monthly Repayment (₦)"
            amount={result.monthly_repayment}
          />

          <FinancialRow
            label="Mayfresh Management and Processing Fee (₦)"
            amount={
              result.management_processing_fee
            }
          />

          <FinancialRow
            label="Forced Save Value (₦)"
            amount={result.property_amount}
          />
        </div>
      </div>

      <div className="btn-row">
        <button
          className="secondary"
          onClick={onNewCalculation}
        >
          New Calculation
        </button>

        <button onClick={onViewAll}>
          View All
        </button>
      </div>
    </div>
  );
}