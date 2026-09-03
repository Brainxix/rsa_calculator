from rest_framework import serializers
from .models import RSAEquityRequest


class RSAEquityRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RSAEquityRequest
        fields = [
            "id",
            "customer_name",
            "mayfresh_account_number",
            "customer_address",
            "rsa_pin",
            "rsa_balance",
            "equity_contribution",
            "is_eligible",
            "created_at",
        ]
        read_only_fields = ["id", "equity_contribution", "is_eligible", "created_at"]

    def validate_mayfresh_account_number(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "Please check the account number. It should be exactly 10 digits."
            )
        return value

    def validate_rsa_pin(self, value):
        if not value.startswith("PEN") or not value[3:].isdigit() or len(value[3:]) != 12:
            raise serializers.ValidationError(
                "Kindly ensure the PIN starts with 'PEN' followed by 12 digits."
            )
        return value

    def validate_rsa_balance(self, value):
        if value < 0:
            raise serializers.ValidationError("RSA Balance cannot be negative.")
        return value

    def create(self, validated_data):
        instance = RSAEquityRequest(**validated_data)
        instance.calculate_equity()
        instance.save()
        return instance
