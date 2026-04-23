from django.core.management.base import BaseCommand
from core.models import Permission
from core.rbac.default_permissions import DEFAULT_PERMISSIONS


class Command(BaseCommand):
    help = "Seed default permissions into database"

    def handle(self, *args, **kwargs):
        created_count = 0

        for code, description in DEFAULT_PERMISSIONS:
            _, created = Permission.objects.get_or_create(
                code=code,
                defaults={"description": description},
            )

            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created_count} new permissions.")
        )