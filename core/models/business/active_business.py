from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class ActiveBusiness(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="active_business"
    )

    business = models.ForeignKey(
        "core.Business",
        on_delete=models.CASCADE,
        related_name="active_users"
    )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} → {self.business}"
