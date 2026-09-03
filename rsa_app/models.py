from django.db import models
from django.core.validators import RegexValidator
# Create your models here.

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
    is_eligible = models.BooleanField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    EQUITY_CONTRIBUTION_RATE = 0.25  # 25% of RSA balance (NHF/RSA-backed rule)

    def calculate_equity(self):
        """Equity contribution = 25% of RSA balance."""
        from decimal import Decimal
        rate = Decimal(str(self.EQUITY_CONTRIBUTION_RATE))
        self.equity_contribution = self.rsa_balance * rate
        self.is_eligible = self.rsa_balance > 0
        return self.equity_contribution

    def __str__(self):
        return f"{self.customer_name} ({self.mayfresh_account_number})"
