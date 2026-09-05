from django.db import models
from django.core.validators import RegexValidator
from decimal import Decimal, ROUND_DOWN
from datetime import timedelta
from django.utils import timezone

mayfresh_account_validator = RegexValidator(
    regex=r"^\d{10}$",
    message="Please check the account number. It should be exactly 10 digits.",
)

rsa_pin_validator = RegexValidator(
    regex=r"^PEN\d{12}$",
    message="Kindly ensure the PIN starts with 'PEN' followed by 12 digits.",
)


class RSAEquityRequest(models.Model):
    """
    Stores each RSA Equity Contribution Calculator submission.
    """

    customer_name = models.CharField(max_length=255)
    mayfresh_account_number = models.CharField(
        max_length=10,
        validators=[mayfresh_account_validator],
    )
    customer_address = models.CharField(max_length=500)
    rsa_pin = models.CharField(
        max_length=15,
        validators=[rsa_pin_validator],
    )
    rsa_balance = models.DecimalField(max_digits=15, decimal_places=2)

    # Computed on save / via the calculate endpoint
    equity_contribution = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    property_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    loan_facility_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    monthly_repayment = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    management_processing_fee = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    is_eligible = models.BooleanField(null=True, blank=True)

    # Auto-generated dates
    statement_date = models.DateField(null=True, blank=True)
    property_offer_letter_date = models.DateField(null=True, blank=True)
    second_verification_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    EQUITY_CONTRIBUTION_RATE = Decimal("0.25")  # 25% of RSA balance
    MANAGEMENT_FEE_RATE = Decimal("0.02")       # 2% of equity contribution
    LOAN_WINDOW_MIN = Decimal("400000")
    LOAN_WINDOW_MAX = Decimal("500000")
    LOAN_ROUNDING_UNIT = Decimal("100000")
    REPAYMENT_ANNUAL_RATE = Decimal("0.09")     # 9% per annum
    REPAYMENT_MONTHS = 120                       # 10 years

    def calculate_equity(self):
        """Equity contribution = 25% of RSA balance."""
        self.equity_contribution = (self.rsa_balance * self.EQUITY_CONTRIBUTION_RATE).quantize(
            Decimal("0.01")
        )
        self.is_eligible = self.rsa_balance > 0
        return self.equity_contribution

    def calculate_property_amount(self):
        """
        Smallest multiple of 100,000 such that
        (Property Amount - Equity Contribution) falls between 400,000 and 500,000.
        """
        if self.equity_contribution is None:
            self.calculate_equity()

        # n = ceil((equity + 400,000) / 100,000)
        raw = (self.equity_contribution + self.LOAN_WINDOW_MIN) / self.LOAN_ROUNDING_UNIT
        n = raw.to_integral_value(rounding="ROUND_CEILING")
        self.property_amount = (n * self.LOAN_ROUNDING_UNIT).quantize(Decimal("0.01"))
        return self.property_amount

    def calculate_loan_facility(self):
        """Loan/Facility Amount = Property Amount - Equity Contribution."""
        if self.property_amount is None:
            self.calculate_property_amount()
        self.loan_facility_amount = (self.property_amount - self.equity_contribution).quantize(
            Decimal("0.01")
        )
        return self.loan_facility_amount

    def calculate_management_fee(self):
        """Management/Processing Fee = 2% of Equity Contribution."""
        if self.equity_contribution is None:
            self.calculate_equity()
        self.management_processing_fee = (
            self.equity_contribution * self.MANAGEMENT_FEE_RATE
        ).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
        return self.management_processing_fee

    def calculate_monthly_repayment(self):
        """
        Amortized Loan/Facility Amount at 9% annual interest over 120 months,
        truncated to whole naira.
        """
        if self.loan_facility_amount is None:
            self.calculate_loan_facility()

        r = self.REPAYMENT_ANNUAL_RATE / Decimal("12")
        n = self.REPAYMENT_MONTHS
        principal = self.loan_facility_amount

        factor_num = r * (1 + r) ** n
        factor_den = (1 + r) ** n - 1
        monthly = principal * (factor_num / factor_den)

        self.monthly_repayment = monthly.quantize(Decimal("1"), rounding=ROUND_DOWN)
        return self.monthly_repayment

    def calculate_dates(self):
        """
        First date = today.
        Property Offer Letter date = today - 7 calendar days.
        Second verification date = today - 4 calendar days.
        """
        today = timezone.localdate()
        self.statement_date = today
        self.property_offer_letter_date = today - timedelta(days=7)
        self.second_verification_date = today - timedelta(days=4)

    def run_all_calculations(self):
        """Runs every calculation in the correct dependency order."""
        self.calculate_equity()
        self.calculate_property_amount()
        self.calculate_loan_facility()
        self.calculate_management_fee()
        self.calculate_monthly_repayment()
        self.calculate_dates()

    def __str__(self):
        return f"{self.customer_name} ({self.mayfresh_account_number})"