# Generated migration for adding unique constraints to recovery fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_rename_account_rec_user_id_is_used_idx_account_rec_user_id_114b84_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='recovery_email',
            field=models.EmailField(
                blank=True,
                null=True,
                unique=True,
                help_text="Alternative email for account recovery if primary email is lost",
                max_length=254
            ),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='recovery_mobile',
            field=models.CharField(
                blank=True,
                null=True,
                unique=True,
                help_text="Alternative phone number for account recovery",
                max_length=20
            ),
        ),
    ]
