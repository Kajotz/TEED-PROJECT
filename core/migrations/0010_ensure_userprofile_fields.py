# Generated migration to ensure all UserProfile fields for password recovery

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_passwordrecoverycode'),
    ]

    operations = [
        # Ensure username_display field exists with proper constraints
        migrations.AlterField(
            model_name='userprofile',
            name='username_display',
            field=models.CharField(
                help_text='Username for display and identity verification',
                max_length=100,
                unique=True
            ),
        ),
        
        # Ensure recovery_email field exists with proper constraints
        migrations.AlterField(
            model_name='userprofile',
            name='recovery_email',
            field=models.EmailField(
                blank=True,
                help_text='Alternative email for account recovery',
                max_length=254,
                null=True,
                unique=True
            ),
        ),
        
        # Ensure recovery_mobile field exists with proper constraints
        migrations.AlterField(
            model_name='userprofile',
            name='recovery_mobile',
            field=models.CharField(
                blank=True,
                help_text='Alternative phone number for account recovery',
                max_length=20,
                null=True,
                unique=True
            ),
        ),
        
        # Ensure phone_number field exists
        migrations.AlterField(
            model_name='userprofile',
            name='phone_number',
            field=models.CharField(
                blank=True,
                help_text='Primary phone number',
                max_length=20,
                null=True
            ),
        ),
        
        # Ensure country field has correct choices
        migrations.AlterField(
            model_name='userprofile',
            name='country',
            field=models.CharField(
                blank=True,
                choices=[
                    ('TZ', 'Tanzania'),
                    ('KE', 'Kenya'),
                    ('UG', 'Uganda'),
                    ('BI', 'Burundi'),
                    ('RW', 'Rwanda'),
                    ('CD', 'DRC'),
                    ('ZM', 'Zambia'),
                ],
                max_length=2,
                null=True
            ),
        ),
    ]
