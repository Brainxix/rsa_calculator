import { useState } from "react";

import { runCalculation } from "../services/calculations";

import ResultsPage from "./ResultsPage";

const initial = {
  customer_name: "",
  mayfresh_account_number: "",
  customer_address: "",
  rsa_pin: "",
  rsa_balance: "",
};

// Formats a raw numeric string with thousand commas for display only
function formatBalance(raw) {
  if (!raw) return raw;
  const [intPart, decPart] = raw.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? formatted + "." + decPart : formatted;
}

const HISTORY_KEY = "rsaCalculations";

function saveToHistory(result) {
  try {
    const existing = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    existing.unshift(result);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(existing)
    );
  } catch {
    // localStorage unavailable — fail silently, calculation still works
  }
}

function validateClient(form) {
  const errors = {};

  if (!form.customer_name.trim()) {
    errors.customer_name = "Customer name is required.";
  }

  if (!/^\d{10}$/.test(form.mayfresh_account_number)) {
    errors.mayfresh_account_number =
      "Account number must be exactly 10 digits.";
  }

  if (!form.customer_address.trim()) {
    errors.customer_address = "Address is required.";
  }

  if (!/^PEN\d{12}$/.test(form.rsa_pin)) {
    errors.rsa_pin =
      "PIN must start with PEN followed by 12 digits.";
  }

  const bal = parseFloat(form.rsa_balance);

  if (isNaN(bal) || bal < 0) {
    errors.rsa_balance =
      "Balance must be a non-negative number.";
  }

  return errors;
}

export default function CalculatorForm({ onSuccess }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState("");

  const update = (e) => {
    const { name, value } = e.target;

    if (name === "rsa_pin") {
      const digitsOnly = value.replace(/[^0-9]/g, "");
      const trimmed = digitsOnly.slice(0, 12);
      const next = `PEN${trimmed}`;

      setForm({
        ...form,
        [name]: next,
      });
    } else if (name === "mayfresh_account_number") {
      const digitsOnly = value
        .replace(/[^0-9]/g, "")
        .slice(0, 10);

      setForm({
        ...form,
        [name]: digitsOnly,
      });
    } else if (name === "rsa_balance") {
      // Strip everything except digits and a single dot
      let cleaned = value.replace(/[^0-9.]/g, "");

      const firstDot = cleaned.indexOf(".");

      if (firstDot !== -1) {
        cleaned =
          cleaned.slice(0, firstDot + 1) +
          cleaned
            .slice(firstDot + 1)
            .replace(/\./g, "");
      }

      // Store raw numeric string (no commas) so parseFloat still works
      setForm({
        ...form,
        [name]: cleaned,
      });
    } else {
      setForm({
        ...form,
        [name]: value.toUpperCase(),
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setBanner("");

    const clientErrors = validateClient(form);

    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});

    try {
      const res = runCalculation(form);

      saveToHistory(res);

      setResult(res);
    } catch (err) {
      setBanner(
        "Something went wrong. Please check your inputs and try again."
      );
    }
  };

  const reset = () => {
    setForm(initial);
    setErrors({});
    setResult(null);
    setBanner("");
  };

  if (result) {
    return (
      <ResultsPage
        result={result}
        onNewCalculation={reset}
        onViewAll={onSuccess}
      />
    );
  }

  return (
    <div className="card calculator-card">
      {banner && (
        <div className="error-banner">
          {banner}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Customer Name</label>

          <input
            name="customer_name"
            value={form.customer_name}
            onChange={update}
            placeholder="e.g. Omotekun Jamiu Babatunde"
            className={
              errors.customer_name ? "invalid" : ""
            }
          />

          {errors.customer_name && (
            <span className="error-text">
              {errors.customer_name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Mayfresh Account Number</label>

          <input
            name="mayfresh_account_number"
            value={form.mayfresh_account_number}
            onChange={update}
            maxLength={10}
            placeholder="10 digits"
            className={
              errors.mayfresh_account_number
                ? "invalid"
                : ""
            }
          />

          {errors.mayfresh_account_number && (
            <span className="error-text">
              {errors.mayfresh_account_number}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Customer Address</label>

          <textarea
            name="customer_address"
            value={form.customer_address}
            onChange={update}
            rows={2}
            placeholder="Street, City"
            className={
              errors.customer_address ? "invalid" : ""
            }
          />

          {errors.customer_address && (
            <span className="error-text">
              {errors.customer_address}
            </span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>RSA PIN</label>

            <input
              name="rsa_pin"
              value={form.rsa_pin}
              onChange={update}
              placeholder="PEN + 12 digits"
              className={
                errors.rsa_pin ? "invalid" : ""
              }
            />

            {errors.rsa_pin && (
              <span className="error-text">
                {errors.rsa_pin}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>RSA Balance (₦)</label>

            <input
              name="rsa_balance"
              value={formatBalance(form.rsa_balance)}
              onChange={update}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className={
                errors.rsa_balance ? "invalid" : ""
              }
            />

            {errors.rsa_balance && (
              <span className="error-text">
                {errors.rsa_balance}
              </span>
            )}
          </div>
        </div>

        <button type="submit">
          Calculate Equity Contribution
        </button>
      </form>
    </div>
  );
}