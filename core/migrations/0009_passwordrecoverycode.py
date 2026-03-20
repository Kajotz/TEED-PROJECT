# Generated migration for adding PasswordRecoveryCode model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0008_add_unique_recovery_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='PasswordRecoveryCode',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(db_index=True, help_text='Email used to request recovery', max_length=254)),
                ('code', models.CharField(db_index=True, max_length=12)),
                ('is_used', models.BooleanField(default=False)),
                ('attempts', models.IntegerField(default=0, help_text='Number of failed verification attempts')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='password_recovery_codes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Password Recovery Code',
                'verbose_name_plural': 'Password Recovery Codes',
                'db_table': 'password_recovery_codes',
            },
        ),
        migrations.AddIndex(
            model_name='passwordrecoverycode',
            index=models.Index(fields=['user', 'is_used'], name='password_recovery_codes_user_is_used_idx'),
        ),
        migrations.AddIndex(
            model_name='passwordrecoverycode',
            index=models.Index(fields=['code'], name='password_recovery_codes_code_idx'),
        ),
        migrations.AddIndex(
            model_name='passwordrecoverycode',
            index=models.Index(fields=['expires_at'], name='password_recovery_codes_expires_at_idx'),
        ),
    ]
