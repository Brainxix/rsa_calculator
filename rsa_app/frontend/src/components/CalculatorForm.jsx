import { useState } from "react";
import { submitCalculation } from "../services/api";

const initial = {
  customer_name: "",
  mayfresh_account_number: "",
  customer_address: "",
  rsa_pin: "",
  rsa_balance: "",
};

function validateClient(form) {
  const errors = {};
  if (!form.customer_name.trim()) errors.customer_name = "Customer name is required.";
  if (!/^\d{10}$/.test(form.mayfresh_account_number))
    errors.mayfresh_account_number = "Account number must be exactly 10 digits.";
  if (!form.customer_address.trim()) errors.customer_address = "Address is required.";
  if (!/^PEN\d{12}$/.test(form.rsa_pin))
    errors.rsa_pin = "PIN must start with PEN followed by 12 digits.";
  const bal = parseFloat(form.rsa_balance);
  if (isNaN(bal) || bal < 0) errors.rsa_balance = "Balance must be a non-negative number.";
  return errors;
}

function formatNaira(value) {
  return "₦" + Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CalculatorForm({ onSuccess }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState("");

  const update = (e) => {
    const { name, value } = e.target;

    if (name === "rsa_pin") {
      // Always start with "PEN", then allow up to 12 digits
      const digitsOnly = value.replace(/[^0-9]/g, "");
      const trimmed = digitsOnly.slice(0, 12);
      const next = `PEN${trimmed}`;
      setForm({ ...form, [name]: next });
    } else if (name === "mayfresh_account_number") {
      // Numbers only, max 10
      const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 10);
      setForm({ ...form, [name]: digitsOnly });
    } else if (name === "rsa_balance") {
      // Numbers + single decimal point
      let cleaned = value.replace(/[^0-9.]/g, "");
      const firstDot = cleaned.indexOf(".");
      if (firstDot !== -1) {
        cleaned =
          cleaned.slice(0, firstDot + 1) +
          cleaned.slice(firstDot + 1).replace(/\./g, "");
      }
      setForm({ ...form, [name]: cleaned });
    } else {
      // Force uppercase for text fields
      setForm({ ...form, [name]: value.toUpperCase() });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner("");

    const clientErrors = validateClient(form);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rsa_balance: parseFloat(form.rsa_balance),
      };
      const res = await submitCalculation(payload);
      setResult(res);
    } catch (err) {
      if (err && typeof err === "object") {
        const flat = {};
        Object.keys(err).forEach((k) => {
          flat[k] = Array.isArray(err[k]) ? err[k][0] : err[k];
        });
        setErrors(flat);
        setBanner("Please correct the highlighted fields.");
      } else {
        setBanner("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
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
      <div className="card">
        <h3 style={{ color: "var(--primary)", marginBottom: 12, fontSize: "1.1rem" }}>
          Calculation Result
        </h3>
        <p style={{ color: "var(--text-light)", fontSize: "0.88rem", marginBottom: 18 }}>
          {result.customer_name}
        </p>

        <div className="equity-highlight">
          <div className="label">Equity Contribution</div>
          <div className="amount">{formatNaira(result.equity_contribution)}</div>
          <div className="sub">25% of RSA balance</div>
        </div>

        <div className="result" style={{ marginTop: 0 }}>
          <div className="row">
            <span className="label">Mayfresh Account</span>
            <span className="value">{result.mayfresh_account_number}</span>
          </div>
          <div className="row">
            <span className="label">RSA PIN</span>
            <span className="value">{result.rsa_pin}</span>
          </div>
          <div className="row">
            <span className="label">Customer Address</span>
            <span className="value" style={{ textAlign: "right", maxWidth: "60%" }}>
              {result.customer_address}
            </span>
          </div>
          <div className="row">
            <span className="label">RSA Balance</span>
            <span className="value">{formatNaira(result.rsa_balance)}</span>
          </div>
          <div className="row">
            <span className="label">Eligibility</span>
            <span className="value">
              <span className={`badge ${result.is_eligible ? "eligible" : "ineligible"}`}>
                {result.is_eligible ? "✓ Eligible" : "✗ Not Eligible"}
              </span>
            </span>
          </div>
        </div>

        <div className="btn-row">
          <button className="secondary" onClick={reset}>
            New Calculation
          </button>
          <button onClick={onSuccess}>View All</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {banner && <div className="error-banner">{banner}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Customer Name</label>
          <input
            name="customer_name"
            value={form.customer_name}
            onChange={update}
            placeholder="e.g. Omotekun Jamiu Babatunde"
            className={errors.customer_name ? "invalid" : ""}
          />
          {errors.customer_name && <span className="error-text">{errors.customer_name}</span>}
        </div>

        <div className="form-group">
          <label>Mayfresh Account Number</label>
          <input
            name="mayfresh_account_number"
            value={form.mayfresh_account_number}
            onChange={update}
            maxLength={10}
            placeholder="10 digits"
            className={errors.mayfresh_account_number ? "invalid" : ""}
          />
          {errors.mayfresh_account_number && (
            <span className="error-text">{errors.mayfresh_account_number}</span>
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
            className={errors.customer_address ? "invalid" : ""}
          />
          {errors.customer_address && <span className="error-text">{errors.customer_address}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>RSA PIN</label>
            <input
              name="rsa_pin"
              value={form.rsa_pin}
              onChange={update}
              placeholder="PEN + 12 digits"
              className={errors.rsa_pin ? "invalid" : ""}
            />
            {errors.rsa_pin && <span className="error-text">{errors.rsa_pin}</span>}
          </div>

          <div className="form-group">
            <label>RSA Balance (₦)</label>
            <input
              name="rsa_balance"
              value={form.rsa_balance}
              onChange={update}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={errors.rsa_balance ? "invalid" : ""}
            />
            {errors.rsa_balance && <span className="error-text">{errors.rsa_balance}</span>}
          </div>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Calculating..." : "Calculate Equity Contribution"}
        </button>
      </form>
    </div>
  );
}