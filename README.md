# RSA Equity Contribution Calculator — Django + DRF

## Setup

1. Copy the `rsa_calculator/` folder into your Django project (next to your other apps).

2. `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       "rest_framework",
       "rsa_calculator",
   ]
   ```

3. Project-level `urls.py`:
   ```python
   from django.urls import path, include
   from rsa_calculator.urls import page_urlpatterns

   urlpatterns = [
       ...
       path("api/", include("rsa_calculator.urls")),   # API endpoints
       path("", include(page_urlpatterns)),             # /calculator/ HTML page
   ]
   ```

4. Migrations:
   ```bash
   python manage.py makemigrations rsa_calculator
   python manage.py migrate
   ```

## Endpoints

| Method | URL                          | Purpose                                   |
|--------|-------------------------------|--------------------------------------------|
| POST   | `/api/rsa-equity/calculate/`  | Submit form, get equity contribution back  |
| GET    | `/api/rsa-equity/`            | List past calculations                     |
| GET    | `/calculator/`                | Renders the HTML form                      |

## Validation rules (matching the mockup)

- **Mayfresh Account Number**: exactly 10 digits.
- **RSA PIN**: must start with `PEN` followed by exactly 12 digits.
- **RSA Balance**: must be a non-negative number.

## Calculation logic

```
equity_contribution = rsa_balance * 0.25   # 25% of RSA balance
is_eligible = rsa_balance > 0
```

Adjust `EQUITY_CONTRIBUTION_RATE` in `models.py` or the eligibility condition
in `models.calculate_equity()` if the real business rule differs (e.g. a
minimum balance threshold, or comparing against a property price).

## Example request

```bash
curl -X POST http://localhost:8000/api/rsa-equity/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
        "customer_name": "Omotekun Jamiu Babatunde",
        "mayfresh_account_number": "6121400012",
        "customer_address": "No 19 Afadurajagun Street, Ijoko",
        "rsa_pin": "PEN100516296211",
        "rsa_balance": 3483000
      }'
```

Response:
```json
{
  "id": 1,
  "customer_name": "Omotekun Jamiu Babatunde",
  "mayfresh_account_number": "6121400012",
  "customer_address": "No 19 Afadurajagun Street, Ijoko",
  "rsa_pin": "PEN100516296211",
  "rsa_balance": "3483000.00",
  "equity_contribution": "870750.00",
  "is_eligible": true,
  "created_at": "2026-09-03T18:00:00Z"
}
```