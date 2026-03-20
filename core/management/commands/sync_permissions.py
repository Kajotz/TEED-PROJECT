# core/management/commands/sync_permissions.py

from django.core.management.base import BaseCommand
from core.rbac.sync_permissions import sync_permissions


class Command(BaseCommand):
    help = "Sync RBAC permissions from the permission catalog into the database"

    def handle(self, *args, **options):
        created_count = sync_permissions()
        self.stdout.write(
            self.style.SUCCESS(
                f"Permission sync complete. Created {created_count} new permissions."
            )
        )