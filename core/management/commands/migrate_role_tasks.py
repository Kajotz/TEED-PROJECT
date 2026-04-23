from django.core.management.base import BaseCommand

from core.models import Role
from core.rbac.tasks import infer_tasks_from_permissions


class Command(BaseCommand):
    help = "Audit role permissions and infer task mappings."

    def handle(self, *args, **options):
        rows = []
        for role in Role.objects.prefetch_related("role_permissions__permission"):
            permission_codes = set(
                role.role_permissions.values_list("permission__code", flat=True)
            )
            tasks, unmapped = infer_tasks_from_permissions(permission_codes)
            rows.append((role, tasks, unmapped))

        if not rows:
            self.stdout.write("No roles found.")
            return

        for role, tasks, unmapped in rows:
            task_text = ", ".join(tasks) if tasks else "(none)"
            self.stdout.write(
                f"{role.business_id} :: {role.name} -> tasks: {task_text}"
            )
            if unmapped:
                self.stdout.write(
                    self.style.WARNING(
                        f"  unmapped_permissions: {', '.join(unmapped)}"
                    )
                )

        self.stdout.write(self.style.SUCCESS("Role task migration audit complete."))
