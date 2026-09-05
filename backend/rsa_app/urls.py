from django.urls import path
from .views import (
    CalculateEligibilityView,
    RSAEquityRequestListView,
    calculator_page,
)

# API endpoints
urlpatterns = [
    path("rsa-equity/calculate/", CalculateEligibilityView.as_view(), name="rsa-equity-calculate"),
    path("rsa-equity/", RSAEquityRequestListView.as_view(), name="rsa-equity-list"),
]

# Page route (mount separately in project urls.py, see README)
page_urlpatterns = [
    path("calculator/", calculator_page, name="rsa-equity-page"),
]
