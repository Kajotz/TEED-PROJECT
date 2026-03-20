"""
Custom registration endpoint that accepts `email`, `password1`, `password2`
Requires email verification before tokens are issued
"""
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import UserProfile, EmailVerification, AccountRecoveryCode
from core.utils.email_service import EmailService
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class CustomRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """
        Register a new user.
        
        Returns:
        - If verification code is provided: Verify and return tokens
        - If no verification code: Send code and require verification
        """
        
        logger.debug("Registration POST data: %s", request.data)
        
        email = request.data.get('email')
        password1 = request.data.get('password1')
        password2 = request.data.get('password2')
        verification_code = request.data.get('verification_code')  # Optional, for verification step

        # Validate required fields
        if not email or not password1 or not password2:
            return Response({
                'error': 'email, password1 and password2 are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if password1 != password2:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(password1) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)

        # If verification code provided, complete registration
        if verification_code:
            return self._complete_registration(email, password1, verification_code)
        
        # Otherwise, send verification code
        return self._send_verification_code(email, password1)
    
    def _send_verification_code(self, email, password):
        """Step 1: Send verification code to user's email"""
        
        # Check if email already registered
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create verification code
            verification = EmailVerification.create_for_email(email)
            
            # Send email
            email_sent = EmailService.send_verification_code(
                email,
                verification.verification_code
            )
            
            if not email_sent:
                return Response({
                    'error': 'Failed to send verification email. Try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return response requiring verification
            return Response({
                'message': f'Verification code sent to {email}',
                'email': email,
                'next_step': 'verify_email',
                'expires_in': 24 * 60 * 60  # 24 hours in seconds
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error during registration step 1: {str(e)}")
            return Response({
                'error': 'Failed to process registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _complete_registration(self, email, password, verification_code):
        """Step 2: Complete registration after verification"""
        
        try:
            # Find the verification code (can be already verified or not)
            verification = EmailVerification.objects.filter(
                email=email,
                verification_code=verification_code
            ).first()
            
            if not verification:
                return Response({
                    'error': 'Invalid verification code'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if verification.is_expired():
                return Response({
                    'error': 'Verification code has expired. Request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # The code doesn't have to be marked verified via the email-verification endpoint
            # It can come directly from signup if the user provides the code immediately
            # OR it can already be verified if they called /api/auth/email-verification/ first
            # Either way, we verify it now before creating the account
            
            if not verification.is_verified:
                # Code hasn't been verified yet, verify it now
                if verification.attempts >= 5:
                    return Response({
                        'error': 'Too many failed attempts. Request a new code.'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
                
                # Mark as verified
                verification.is_verified = True
                verification.verified_at = timezone.now()
                verification.save()
            
            # Create user
            username = email.split('@')[0]
            user = User.objects.create_user(
                email=email,
                username=username,
                password=password
            )
            
            # Create UserProfile with verified flag
            profile = UserProfile.objects.create(
                user=user,
                username_display=username,
                email_verified=True,
                email_verified_at=timezone.now()
            )
            
            # Mark verification as complete
            verification.is_verified = True
            verification.verified_at = timezone.now()
            verification.save()
            
            # Generate recovery codes
            recovery_codes = AccountRecoveryCode.create_for_user(user)
            
            # Send recovery codes to email
            EmailService.send_recovery_codes(user, recovery_codes)
            
            # Issue JWT tokens
            refresh = RefreshToken.for_user(user)
            
            logger.info(f"User registered successfully: {email}")
            
            response_data = {
                'message': 'Registration successful! Email verified.',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'recovery_codes_sent': True
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({
                'error': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error during registration step 2: {str(e)}")
            return Response({
                'error': 'Failed to complete registration'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
