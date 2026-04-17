from rest_framework.permissions import BasePermission
from accounts.models import EmployerApplication


class IsApprovedEmployer(BasePermission):
    """
    Allows access only to approved employers.
    Legacy employers (without an application) are treated as approved.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if getattr(user, "role", None) != "employer":
            return False

        try:
            application = EmployerApplication.objects.get(user=user)
            return application.status == "approved"
        except EmployerApplication.DoesNotExist:
            # Legacy employer accounts created before the review flow
            return True