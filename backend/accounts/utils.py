from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

from profiles.models import Notification

User = get_user_model()


def create_notification(user, notification_type, title, message, target_id=None):
    try:
        Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            target_id=target_id,
        )
    except Exception:
        pass


def notify_admins_new_employer_application(application):
    admins = User.objects.filter(role="admin")

    for admin in admins:
        create_notification(
            user=admin,
            notification_type="application",
            title="New Employer Application",
            message=(
                f"A new employer application was submitted by "
                f"{application.user.username} for {application.company_name}."
            ),
            target_id=application.id,
        )


def notify_employer_application_review(application):
    if application.status == "approved":
        title = "Employer Application Approved"
        message = (
            f"Your employer application for {application.company_name} has been approved. "
            f"You can now log in and use your employer dashboard."
        )
    elif application.status == "rejected":
        title = "Employer Application Rejected"
        message = (
            f"Your employer application for {application.company_name} was rejected."
        )
    else:
        return

    create_notification(
        user=application.user,
        notification_type="status_update",
        title=title,
        message=message,
        target_id=application.id,
    )


def send_platform_email(subject, message, recipient_list):
    if not recipient_list:
        return

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=recipient_list,
            fail_silently=True,
        )
    except Exception:
        pass