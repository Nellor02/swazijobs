from django.urls import path
from .views import CompanyListAPIView, CompanyDetailAPIView, MyCompanyAPIView

urlpatterns = [
    path("", CompanyListAPIView.as_view(), name="company-list"),
    path("me/", MyCompanyAPIView.as_view(), name="my-company"),
    path("<int:pk>/", CompanyDetailAPIView.as_view(), name="company-detail"),
]