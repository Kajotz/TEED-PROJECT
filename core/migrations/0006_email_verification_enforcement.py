from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_email_verification_account_recovery'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_verified',
            field=models.BooleanField(default=False, help_text='Email address has been verified'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='email_verified_at',
            field=models.DateTimeField(blank=True, null=True, help_text='Timestamp when email was verified'),
        ),
    ]
