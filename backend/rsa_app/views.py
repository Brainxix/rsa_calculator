from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .models import RSAEquityRequest
from .serializers import RSAEquityRequestSerializer


class CalculateEligibilityView(APIView):
    """POST: Submit a new RSA equity calculation."""

    def post(self, request):
        serializer = RSAEquityRequestSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response(
                RSAEquityRequestSerializer(instance).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RSAEquityRequestListView(generics.ListAPIView):
    """GET: List all past RSA equity calculations."""

    queryset = RSAEquityRequest.objects.all().order_by("-created_at")
    serializer_class = RSAEquityRequestSerializer


def calculator_page(request):
    """Render the HTML form page."""
    return render(request, "rsa_app/calculator.html")
