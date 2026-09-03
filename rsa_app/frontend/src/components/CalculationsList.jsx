import { useEffect, useState } from "react";
import { fetchCalculations } from "../services/api";

export default function CalculationsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCalculations()
      .then(setItems)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card">Loading…</div>;
  if (error) return <div className="card error-banner">{error}</div>;
  if (!items.length)
    return <div className="card">No past calculations yet.</div>;

  return (
    <div className="card">
      <h2 style={{ color: "var(--primary)", marginBottom: 18 }}>
        Past Calculations
      </h2>
      {items.map((item) => (
        <div
          key={item.id}
          className="result"
          style={{ marginTop: 0, marginBottom: 16 }}
        >
          <h3>{item.customer_name}</h3>
          <div className="row">
            <span className="label">Account</span>
            <span className="value">{item.mayfresh_account_number}</span>
          </div>
          <div className="row">
            <span className="label">Balance</span>
            <span className="value">₦{Number(item.rsa_balance).toLocaleString()}</span>
          </div>
          <div className="row">
            <span className="label">Equity</span>
            <span className="value">
              ₦{Number(item.equity_contribution).toLocaleString()}
            </span>
          </div>
          <div className="row">
            <span className="label">Status</span>
            <span className="value">
              <span className={`badge ${item.is_eligible ? "eligible" : "ineligible"}`}>
                {item.is_eligible ? "Eligible" : "Not Eligible"}
              </span>
            </span>
          </div>
          <div className="row">
            <span className="label">Submitted</span>
            <span className="value">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}