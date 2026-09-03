const API_BASE = "/api/rsa-equity";

export async function submitCalculation(data) {
  const res = await fetch(`${API_BASE}/calculate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw json; // DRF returns { field: ["errors"] }
  }
  return json;
}

export async function fetchCalculations() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch calculations");
  return res.json();
}