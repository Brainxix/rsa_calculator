from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import RSAEquityRequest


@admin.register(RSAEquityRequest)
class RSAEquityRequestAdmin(admin.ModelAdmin):
    list_display = (
        "customer_name",
        "mayfresh_account_number",
        "rsa_balance",
        "equity_contribution",
        "is_eligible",
        "created_at",
    )
    search_fields = ("customer_name", "mayfresh_account_number", "rsa_pin")
    list_filter = ("is_eligible", "created_at")
