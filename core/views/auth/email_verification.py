"""
Email verification and account recovery views
Handles email verification during signup and account recovery flows
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from core.models import EmailVerification, AccountRecoveryCode, RecoveryContact
from core.serializers import (
    EmailVerificationSerializer, EmailVerificationConfirmSerializer,
    AccountRecoveryCodeSerializer, RecoveryContactSerializer,
    AccountRecoverySerializer
)
from core.utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)


class EmailVerificationView(APIView):
    """
    Handle email verification during signup
    POST /api/auth/email-verification/send/ - Send verification code
    POST /api/auth/email-verification/verify/ - Verify email with code
    """
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Send verification code to email"""
        
        action = request.data.get('action')
        
        if action == 'send':
            return self._send_verification_code(request)
        elif action == 'verify':
            return self._verify_email(request)
        else:
            return Response(
                {'error': 'Invalid action. Use "send" or "verify".'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _send_verification_code(self, request):
        """Send verification code to email"""
        serializer = EmailVerificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        
        try:
            # Create verification record
            verification = EmailVerification.create_for_email(email)
            
            # Send email
            email_sent = EmailService.send_verification_code(
                email,
                verification.verification_code
            )
            
            if not email_sent:
                return Response(
                    {'error': 'Failed to send verification email. Try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                {
                    'message': f'Verification code sent to {email}',
                    'email': email,
                    'expires_in': 24 * 60 * 60  # 24 hours in seconds
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error sending verification code: {str(e)}")
            return Response(
                {'error': 'Failed to process request.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _verify_email(self, request):
        """Verify email with verification code"""
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        code = serializer.validated_data['verification_code']
        
        try:
            # Find verification record
            verification = EmailVerification.objects.filter(
                email=email,
                verification_code=code,
                is_verified=False
            ).first()
            
            if not verification:
                return Response(
                    {'error': 'Invalid verification code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if expired
            if verification.is_expired():
                return Response(
                    {'error': 'Verification code has expired. Request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check attempts
            if verification.attempts >= 5:
                return Response(
                    {'error': 'Too many failed attempts. Request a new code.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Mark as verified
            verification.is_verified = True
            verification.verified_at = timezone.now()
            verification.save()
            
            # Update user profile if user exists (for standalone verification)
            from django.contrib.auth.models import User
            try:
                user = User.objects.get(email=email)
                profile = user.profile
                profile.email_verified = True
                profile.email_verified_at = timezone.now()
                profile.save()
                logger.info(f"Email verified and marked for user: {email}")
            except User.DoesNotExist:
                # User not created yet (verification sent before signup)
                logger.info(f"Email verified but user not created yet: {email}")
            
            return Response(
                {
                    'message': 'Email verified successfully! You can now sign up.',
                    'email': email,
                    'verified_at': verification.verified_at,
                    'next_step': 'complete_signup'
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error verifying email: {str(e)}")
            # Increment attempts
            try:
                verification.attempts += 1
                verification.save()
            except:
                pass
            
            return Response(
                {'error': 'Failed to verify email.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )            # Increment attempts
            verification.attempts += 1
            verification.save()
            
            return Response(
                {'error': 'Failed to verify email.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AccountRecoveryView(APIView):
    """
    Handle account recovery using recovery codes
    POST /api/auth/account-recovery/ - Recover account using recovery code
    """
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Recover account using recovery code"""
        
        serializer = AccountRecoverySerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        recovery_code = serializer.validated_data['recovery_code']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Hash the provided code
            code_hash = AccountRecoveryCode.hash_code(recovery_code)
            
            # Find recovery code
            recovery = AccountRecoveryCode.objects.filter(
                code_hash=code_hash,
                is_used=False
            ).first()
            
            if not recovery:
                logger.warning(f"Invalid recovery code attempt: {recovery_code[:4]}***")
                return Response(
                    {'error': 'Invalid recovery code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update user password
            user = recovery.user
            user.set_password(new_password)
            user.save()
            
            # Mark recovery code as used
            recovery.is_used = True
            recovery.used_at = timezone.now()
            recovery.save()
            
            # Send notification
            EmailService.send_account_recovery_notification(user)
            
            logger.info(f"Account recovery used for user: {user.username}")
            
            return Response(
                {
                    'message': 'Account recovered successfully! Please log in with your new password.',
                    'redirect_to': '/login'
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error during account recovery: {str(e)}")
            return Response(
                {'error': 'Failed to recover account.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RecoveryContactView(APIView):
    """
    Manage recovery contacts (alternate email, phone)
    GET /api/auth/recovery-contacts/ - Get user's recovery contacts
    POST /api/auth/recovery-contacts/ - Add new recovery contact
    PATCH /api/auth/recovery-contacts/{id}/ - Update recovery contact
    DELETE /api/auth/recovery-contacts/{id}/ - Remove recovery contact
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's recovery contacts"""
        try:
            contacts = RecoveryContact.objects.filter(user=request.user)
            data = []
            
            for contact in contacts:
                data.append({
                    'id': str(contact.id),
                    'contact_type': contact.contact_type,
                    'contact_value': self._mask_contact(contact.contact_value, contact.contact_type),
                    'is_verified': contact.is_verified,
                    'is_primary': contact.is_primary,
                    'created_at': contact.created_at
                })
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching recovery contacts: {str(e)}")
            return Response(
                {'error': 'Failed to fetch recovery contacts.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Add new recovery contact"""
        serializer = RecoveryContactSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contact_type = serializer.validated_data['contact_type']
        contact_value = serializer.validated_data['contact_value']
        
        try:
            # Check if contact already exists
            existing = RecoveryContact.objects.filter(
                user=request.user,
                contact_type=contact_type
            ).first()
            
            if existing:
                return Response(
                    {'error': f'You already have a {contact_type} recovery contact.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create contact
            verification_code = RecoveryContact.generate_code()
            contact = RecoveryContact.objects.create(
                user=request.user,
                contact_type=contact_type,
                contact_value=contact_value,
                verification_code=verification_code
            )
            
            # Send verification code
            EmailService.send_recovery_contact_verification(
                contact_value,
                verification_code,
                contact_type
            )
            
            return Response(
                {
                    'message': f'Verification code sent to {contact_type}.',
                    'id': str(contact.id),
                    'contact_type': contact_type,
                    'requires_verification': True
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Error adding recovery contact: {str(e)}")
            return Response(
                {'error': 'Failed to add recovery contact.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def patch(self, request, contact_id=None):
        """Verify or update recovery contact"""
        
        action = request.data.get('action')
        
        if action == 'verify':
            return self._verify_contact(request, contact_id)
        elif action == 'set_primary':
            return self._set_primary(request, contact_id)
        else:
            return Response(
                {'error': 'Invalid action.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _verify_contact(self, request, contact_id):
        """Verify recovery contact with code"""
        try:
            contact = RecoveryContact.objects.get(id=contact_id, user=request.user)
            code = request.data.get('code')
            
            if contact.is_verified:
                return Response(
                    {'error': 'Contact already verified.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if contact.verification_attempts >= 5:
                return Response(
                    {'error': 'Too many failed attempts.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            if contact.verification_code != code:
                contact.verification_attempts += 1
                contact.save()
                return Response(
                    {'error': 'Invalid verification code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as verified
            contact.is_verified = True
            contact.verified_at = timezone.now()
            contact.verification_code = None
            contact.save()
            
            return Response(
                {'message': 'Recovery contact verified successfully.'},
                status=status.HTTP_200_OK
            )
            
        except RecoveryContact.DoesNotExist:
            return Response(
                {'error': 'Recovery contact not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _set_primary(self, request, contact_id):
        """Set contact as primary recovery contact"""
        try:
            contact = RecoveryContact.objects.get(id=contact_id, user=request.user)
            
            if not contact.is_verified:
                return Response(
                    {'error': 'Contact must be verified first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Unset other primary contacts
            RecoveryContact.objects.filter(
                user=request.user,
                is_primary=True
            ).update(is_primary=False)
            
            # Set this as primary
            contact.is_primary = True
            contact.save()
            
            return Response(
                {'message': 'Primary recovery contact updated.'},
                status=status.HTTP_200_OK
            )
            
        except RecoveryContact.DoesNotExist:
            return Response(
                {'error': 'Recovery contact not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, contact_id=None):
        """Delete recovery contact"""
        try:
            contact = RecoveryContact.objects.get(id=contact_id, user=request.user)
            contact.delete()
            
            return Response(
                {'message': 'Recovery contact removed.'},
                status=status.HTTP_200_OK
            )
            
        except RecoveryContact.DoesNotExist:
            return Response(
                {'error': 'Recovery contact not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @staticmethod
    def _mask_contact(value, contact_type):
        """Mask sensitive contact information"""
        if contact_type == 'email':
            parts = value.split('@')
            visible = parts[0][:2] if len(parts[0]) > 2 else parts[0]
            return f"{visible}***@{parts[1]}"
        elif contact_type == 'phone':
            return f"***{value[-4:]}"
        return value

class DebugVerificationView(APIView):
    """
    DEBUG ONLY: Get verification code for development/testing
    This endpoint should be removed in production
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Get verification code for a given email (dev only)"""
        
        # Only allow in development
        from django.conf import settings
        if not settings.DEBUG:
            return Response(
                {'error': 'This endpoint is only available in development'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.query_params.get('email')
        if not email:
            return Response(
                {'error': 'Please provide email parameter: ?email=test@example.com'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification = EmailVerification.objects.filter(email=email).order_by('-created_at').first()
            
            if not verification:
                return Response(
                    {'error': f'No verification code found for {email}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'email': verification.email,
                'code': verification.verification_code,
                'is_verified': verification.is_verified,
                'is_expired': verification.is_expired(),
                'created_at': verification.created_at,
                'expires_at': verification.expires_at,
                'attempts': verification.attempts,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in debug view: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )