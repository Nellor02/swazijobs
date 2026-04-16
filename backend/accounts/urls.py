from django.urls import path
from .views import (
    CurrentUserAPIView,
    SeekerRegisterAPIView,
    EmployerApplyAPIView,
    EmployerApplicationMeAPIView,
    AdminEmployerApplicationListAPIView,
    AdminEmployerApplicationDetailAPIView,
    AdminEmployerApplicationReviewAPIView,
)

urlpatterns = [
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("register/seeker/", SeekerRegisterAPIView.as_view(), name="register-seeker"),
    path("register/employer/", EmployerApplyAPIView.as_view(), name="register-employer"),
    path("employer-application/me/", EmployerApplicationMeAPIView.as_view(), name="employer-application-me"),
    path("admin/employer-applications/", AdminEmployerApplicationListAPIView.as_view(), name="admin-employer-applications"),
    path("admin/employer-applications/<int:pk>/", AdminEmployerApplicationDetailAPIView.as_view(), name="admin-employer-application-detail"),
    path("admin/employer-applications/<int:pk>/review/", AdminEmployerApplicationReviewAPIView.as_view(), name="admin-employer-application-review"),
]