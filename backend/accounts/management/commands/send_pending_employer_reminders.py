from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import EmployerApplication
from accounts.utils import create_notification, send_platform_email


class Command(BaseCommand):
    help = "Send reminder notifications/emails for employer applications still pending after 24 hours."

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(hours=24)

        pending_applications = EmployerApplication.objects.filter(
            status="pending",
            submitted_at__lte=threshold,
            pending_reminder_sent_at__isnull=True,
        ).select_related("user")

        count = 0

        for application in pending_applications:
            create_notification(
                user=application.user,
                notification_type="status_update",
                title="Employer Application Still Pending",
                message=(
                    f"Your employer application for {application.company_name} is still pending review."
                ),
                target_id=application.id,
            )

            if application.user.email:
                send_platform_email(
                    subject="SwiftHire Employer Application Still Pending",
                    message=(
                        f"Hello {application.user.username},\n\n"
                        f"Your employer application for {application.company_name} "
                        f"is still pending review.\n\n"
                        f"We will notify you again once a final decision is made."
                    ),
                    recipient_list=[application.user.email],
                )

            application.pending_reminder_sent_at = timezone.now()
            application.save(update_fields=["pending_reminder_sent_at"])
            count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed pending employer reminders: {count}"
            )
        )