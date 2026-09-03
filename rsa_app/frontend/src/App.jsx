import { useState } from "react";
import CalculatorForm from "./components/CalculatorForm";
import CalculationsList from "./components/CalculationsList";
import "./App.css";

function App() {
  const [view, setView] = useState("form");

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo">RSA</div>
        <div className="title-group">
          <h1>RSA Equity Contribution Calculator</h1>
          <div className="badge-line">25% Equity Builder</div>
        </div>
      </div>
      <p className="subtitle">
        Compute the equity contribution from your RSA balance for Mayfresh account holders.
      </p>

      {view === "form" ? (
        <CalculatorForm onSuccess={() => setView("history")} />
      ) : (
        <CalculationsList onBack={() => setView("form")} />
      )}

      <div className="history-link">
        {view === "form" ? (
          <a href="#" onClick={(e) => { e.preventDefault(); setView("history"); }}>
            View past calculations →
          </a>
        ) : (
          <a href="#" onClick={(e) => { e.preventDefault(); setView("form"); }}>
            ← Back to calculator
          </a>
        )}
      </div>
    </div>
  );
}

export default App;