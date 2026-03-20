from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_remove_userprofile_bio_and_more'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailVerification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(db_index=True, max_length=254)),
                ('verification_code', models.CharField(max_length=6, unique=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('attempts', models.IntegerField(default=0, help_text='Number of failed verification attempts')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Email Verification',
                'verbose_name_plural': 'Email Verifications',
                'db_table': 'email_verifications',
            },
        ),
        migrations.CreateModel(
            name='AccountRecoveryCode',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code_hash', models.CharField(max_length=128, unique=True)),
                ('code_display', models.CharField(help_text='Last 4 digits for user reference', max_length=12)),
                ('is_used', models.BooleanField(default=False)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recovery_codes', to='auth.user')),
            ],
            options={
                'verbose_name': 'Account Recovery Code',
                'verbose_name_plural': 'Account Recovery Codes',
                'db_table': 'account_recovery_codes',
            },
        ),
        migrations.CreateModel(
            name='RecoveryContact',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('contact_type', models.CharField(choices=[('email', 'Alternate Email'), ('phone', 'Phone Number')], max_length=10)),
                ('contact_value', models.CharField(db_index=True, max_length=255)),
                ('is_verified', models.BooleanField(default=False)),
                ('is_primary', models.BooleanField(default=False, help_text='Primary recovery contact')),
                ('verification_code', models.CharField(blank=True, max_length=6, null=True)),
                ('verification_attempts', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recovery_contacts', to='auth.user')),
            ],
            options={
                'verbose_name': 'Recovery Contact',
                'verbose_name_plural': 'Recovery Contacts',
                'db_table': 'recovery_contacts',
                'unique_together': {('user', 'contact_type')},
            },
        ),
        migrations.AddIndex(
            model_name='emailverification',
            index=models.Index(fields=['email', 'is_verified'], name='email_verif_email_id_verified_idx'),
        ),
        migrations.AddIndex(
            model_name='emailverification',
            index=models.Index(fields=['verification_code'], name='email_verif_verifi_idx'),
        ),
        migrations.AddIndex(
            model_name='emailverification',
            index=models.Index(fields=['expires_at'], name='email_verif_expires_idx'),
        ),
        migrations.AddIndex(
            model_name='accountrecoverycode',
            index=models.Index(fields=['user', 'is_used'], name='account_rec_user_id_is_used_idx'),
        ),
        migrations.AddIndex(
            model_name='accountrecoverycode',
            index=models.Index(fields=['code_hash'], name='account_rec_code_ha_idx'),
        ),
        migrations.AddIndex(
            model_name='recoverycontact',
            index=models.Index(fields=['user', 'is_verified'], name='recovery_co_user_id_is_verif_idx'),
        ),
        migrations.AddIndex(
            model_name='recoverycontact',
            index=models.Index(fields=['contact_value'], name='recovery_co_contact_idx'),
        ),
    ]
