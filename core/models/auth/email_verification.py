"""
Email Verification and Account Recovery Models
Handles email verification codes, recovery codes, and account recovery mechanisms
"""

from django.db import models
from django.contrib.auth.models import User
import uuid
import secrets
from django.utils import timezone
from datetime import timedelta


class EmailVerification(models.Model):
    """
    Email verification codes sent to users during signup
    - One code per email verification request
    - Code expires after 24 hours
    - Can only be used once
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    verification_code = models.CharField(max_length=6, unique=True)
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0, help_text="Number of failed verification attempts")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'email_verifications'
        verbose_name = 'Email Verification'
        verbose_name_plural = 'Email Verifications'
        indexes = [
            models.Index(fields=['email', 'is_verified']),
            models.Index(fields=['verification_code']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.verification_code}"
    
    def is_expired(self):
        """Check if verification code has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if code can still be used"""
        return not self.is_expired() and not self.is_verified and self.attempts < 5
    
    @staticmethod
    def generate_code():
        """Generate a random 6-digit verification code"""
        return str(secrets.randbelow(1000000)).zfill(6)
    
    @staticmethod
    def create_for_email(email):
        """Create a new verification code for email"""
        # Invalidate old codes for this email
        EmailVerification.objects.filter(email=email, is_verified=False).update(expires_at=timezone.now())
        
        code = EmailVerification.generate_code()
        verification = EmailVerification.objects.create(
            email=email,
            verification_code=code,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        return verification


class AccountRecoveryCode(models.Model):
    """
    One-time 12-digit recovery codes for account access recovery
    - User gets 10 codes during signup
    - Each code can be used only once
    - User can regenerate codes anytime
    - Codes are hashed for security (not plaintext in DB)
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recovery_codes')
    code_hash = models.CharField(max_length=128, unique=True)  # SHA256 hash
    code_display = models.CharField(max_length=12, help_text="Last 4 digits for user reference")
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'account_recovery_codes'
        verbose_name = 'Account Recovery Code'
        verbose_name_plural = 'Account Recovery Codes'
        indexes = [
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['code_hash']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.code_display}"
    
    @staticmethod
    def generate_code():
        """Generate a random 12-digit recovery code"""
        return str(secrets.randbelow(10**12)).zfill(12)
    
    @staticmethod
    def hash_code(code):
        """Hash a recovery code using SHA256"""
        import hashlib
        return hashlib.sha256(code.encode()).hexdigest()
    
    @staticmethod
    def create_for_user(user, count=10):
        """Create multiple recovery codes for user (deletes old ones)"""
        # Delete old unused codes
        user.recovery_codes.filter(is_used=False).delete()
        
        codes = []
        for _ in range(count):
            code = AccountRecoveryCode.generate_code()
            code_hash = AccountRecoveryCode.hash_code(code)
            code_display = code[-4:]  # Last 4 digits
            
            recovery = AccountRecoveryCode.objects.create(
                user=user,
                code_hash=code_hash,
                code_display=code_display
            )
            codes.append({
                'id': str(recovery.id),
                'code': code,  # Only shown once during creation
                'display': code_display
            })
        
        return codes


class RecoveryContact(models.Model):
    """
    Alternative recovery contacts (email or phone)
    Users can set these for account recovery if they lose email access
    """
    
    CONTACT_TYPE_CHOICES = [
        ('email', 'Alternate Email'),
        ('phone', 'Phone Number'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recovery_contacts')
    contact_type = models.CharField(max_length=10, choices=CONTACT_TYPE_CHOICES)
    contact_value = models.CharField(max_length=255, db_index=True)  # Email or phone
    is_verified = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False, help_text="Primary recovery contact")
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    verification_attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'recovery_contacts'
        verbose_name = 'Recovery Contact'
        verbose_name_plural = 'Recovery Contacts'
        unique_together = [('user', 'contact_type')]  # One email, one phone per user
        indexes = [
            models.Index(fields=['user', 'is_verified']),
            models.Index(fields=['contact_value']),
        ]
    
    def __str__(self):
        contact_display = self.contact_value
        if self.contact_type == 'email':
            contact_display = self.contact_value[:20] + '...' if len(self.contact_value) > 20 else self.contact_value
        return f"{self.user.username} - {self.get_contact_type_display()}: {contact_display}"
    
    def is_code_valid(self):
        """Check if verification code is still valid"""
        return self.verification_attempts < 5
    
    @staticmethod
    def generate_code():
        """Generate a 6-digit verification code"""
        return str(secrets.randbelow(1000000)).zfill(6)


class PasswordRecoveryCode(models.Model):
    """
    Temporary 12-digit codes for password recovery process
    - Generated during forgot password flow
    - Expires after 30 minutes
    - Rate limited: 5 attempts per 24 hours
    - Only valid for the user who requested recovery
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_recovery_codes')
    email = models.EmailField(db_index=True, help_text="Email used to request recovery")
    code = models.CharField(max_length=12, db_index=True)  # 12-digit code
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0, help_text="Number of failed verification attempts")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_recovery_codes'
        verbose_name = 'Password Recovery Code'
        verbose_name_plural = 'Password Recovery Codes'
        indexes = [
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['code']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.code}"
    
    def is_expired(self):
        """Check if recovery code has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if code can still be used"""
        return not self.is_expired() and not self.is_used and self.attempts < 5
    
    @staticmethod
    def generate_code():
        """Generate a random 12-digit recovery code"""
        return ''.join(str(secrets.randbelow(10)) for _ in range(12))
    
    @staticmethod
    def create_for_user(user, email):
        """Create a new temporary recovery code for password reset"""
        # Invalidate old unused codes for this user
        PasswordRecoveryCode.objects.filter(user=user, is_used=False).update(expires_at=timezone.now())
        
        code = PasswordRecoveryCode.generate_code()
        recovery = PasswordRecoveryCode.objects.create(
            user=user,
            email=email,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=30)
        )
        return recovery
    
    @staticmethod
    def get_rate_limit_exceeded(user, hours=24):
        """Check if user has exceeded recovery attempts in the last N hours"""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        recent_attempts = PasswordRecoveryCode.objects.filter(
            user=user,
            created_at__gte=cutoff_time
        ).count()
        return recent_attempts >= 5

