from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import BasicAuthentication
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
import logging
from core.models import UserProfile

# myapp/views.py
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import BasicAuthentication
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

User = get_user_model()


# ============================================================
# CUSTOM TOKEN OBTAIN VIEW (Email-based login)
# ============================================================
from rest_framework import serializers


class EmailTokenObtainPairSerializer(serializers.Serializer):
    """
    Simple serializer that accepts `email` and `password`, authenticates
    the user and returns JWT `access` and `refresh` tokens.
    REQUIRES: User's email must be verified first
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password')

        # Check if email is verified
        try:
            profile = user.profile
            if not profile.email_verified:
                raise serializers.ValidationError({
                    'error': 'Email not verified',
                    'email': email,
                    'message': 'Please verify your email address first. Check your inbox for the verification code.',
                    'next_step': 'verify_email'
                })
        except:
            # Profile doesn't exist or other issue
            raise serializers.ValidationError('Email not verified. Please complete registration.')

        user = authenticate(username=user.username, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid email or password')

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class EmailTokenObtainPairView(TokenObtainPairView):
    """
    Endpoint that accepts `email` and `password` and returns JWT tokens.
    Only works if user's email has been verified.
    """
    serializer_class = EmailTokenObtainPairSerializer

class GoogleAuthView(APIView):
    """
    Google OAuth Token Exchange Endpoint
    Request: POST /api/auth/google/ with { token: "google_id_token" }
    Response: { access: "jwt_token", refresh: "jwt_token" }
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # avoid session-auth + CSRF for this endpoint

    def post(self, request):
        token = request.data.get("token")
        captcha = request.data.get("captcha")

        if not token:
            return Response({"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1) Verify reCAPTCHA if configured
        recaptcha_secret = getattr(settings, "RECAPTCHA_SECRET_KEY", None)
        if recaptcha_secret:
            if not captcha:
                return Response({"error": "Captcha missing"}, status=status.HTTP_400_BAD_REQUEST)
            resp = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={"secret": recaptcha_secret, "response": captcha},
                timeout=5,
            )
            result = resp.json()
            # small threshold — tune for your use case
            if not result.get("success") or result.get("score", 0) < 0.3:
                return Response({"error": "Captcha verification failed"}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Verify Google id_token
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
        except ValueError:
            return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        # check audience just in case
        if idinfo.get("aud") != settings.GOOGLE_CLIENT_ID:
            return Response({"error": "Token audience mismatch"}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get("email")
        name = idinfo.get("name")
        sub = idinfo.get("sub")  # google user id

        if not email:
            return Response({"error": "No email in token"}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Create or fetch user
        user, created = User.objects.get_or_create(email=email, defaults={"username": email.split("@")[0]})
        if created:
            # Set first_name/last_name from Google profile
            user.first_name = name or ""
            user.save()

        # 4) Create or update UserProfile with defaults for Google users
        email_prefix = email.split("@")[0]
        
        # Generate unique username_display if needed
        username_display = email_prefix
        counter = 1
        while UserProfile.objects.filter(username_display=username_display).exclude(user=user).exists():
            username_display = f"{email_prefix}{counter}"
            counter += 1
        
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'username_display': username_display,
                'phone_number': '',  # Empty for Google signup
                'country': '',  # Empty for Google signup - user can set later
                'email_verified': True,  # Google already verified the email
                'email_verified_at': timezone.now(),
            }
        )
        
        # If profile already exists, just update the username_display if needed
        if not profile_created:
            if profile.username_display == user.username:  # If it was a placeholder, update it
                profile.username_display = username_display
            # Mark email as verified for Google users
            if not profile.email_verified:
                profile.email_verified = True
                profile.email_verified_at = timezone.now()
            profile.save()

        # 5) Issue JWTs
        refresh = RefreshToken.for_user(user)

        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_200_OK,
        )

        # -- OPTION B (recommended production): set refresh token as httpOnly cookie --
        # resp = Response({"access": str(refresh.access_token)}, status=status.HTTP_200_OK)
        # resp.set_cookie(
        #     key="refresh",
        #     value=str(refresh),
        #     httponly=True,
        #     secure=not settings.DEBUG,
        #     samesite="Lax",
        #     max_age=7 * 24 * 60 * 60,
        # )
        # return resp

@api_view(['GET'])
def hello(request):
    return Response({"message": "Welcome to TEED Hub API"})

# Create your views here.
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def test_api(request):
    return Response({"status": "success", "message": "Django API is working!"})


# ============================================================
# PHONE OTP AUTHENTICATION
# ============================================================
import uuid
from django.core.cache import cache
import random

class PhoneOTPLoginView(APIView):
    """
    Send OTP to phone number.
    Returns session_id to be used in verification.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        
        if not phone:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate OTP (6 digits)
        otp = str(random.randint(100000, 999999))
        session_id = str(uuid.uuid4())
        
        # Store in cache for 10 minutes
        cache.set(f"phone_otp:{session_id}", {"phone": phone, "otp": otp}, timeout=600)
        
        # TODO: Send OTP via SMS service (e.g., Twilio, AWS SNS)
        # For development, print to console
        print(f"[DEV] OTP for {phone}: {otp}")
        
        return Response(
            {
                "message": "OTP sent successfully",
                "session_id": session_id,
                "debug_otp": otp if settings.DEBUG else None  # Only in development
            },
            status=status.HTTP_200_OK
        )


class PhoneOTPVerifyView(APIView):
    """
    Verify OTP and issue JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get("session_id")
        otp = request.data.get("otp")
        
        if not session_id or not otp:
            return Response(
                {"error": "session_id and otp are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retrieve OTP from cache
        cached_data = cache.get(f"phone_otp:{session_id}")
        
        if not cached_data:
            return Response(
                {"error": "OTP expired or session not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if cached_data["otp"] != otp:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clear OTP from cache
        cache.delete(f"phone_otp:{session_id}")
        
        phone = cached_data["phone"]
        
        # Get or create user with phone as username
        # (in production, you'd have a User profile with phone field)
        user, created = User.objects.get_or_create(
            username=phone,
            defaults={"email": f"{phone}@phone.local"}  # Placeholder email
        )
        
        # Issue JWTs
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": str(user.id)
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# PHONE SIGNUP (REGISTRATION)
# ============================================================
class PhoneSignupView(APIView):
    """
    Initiate phone signup by sending OTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        
        if not phone:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=phone).exists():
            return Response(
                {"error": "This phone number is already registered"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        session_id = str(uuid.uuid4())
        
        # Store in cache for 10 minutes
        cache.set(f"phone_signup:{session_id}", {"phone": phone, "otp": otp}, timeout=600)
        
        # TODO: Send OTP via SMS
        print(f"[DEV] Signup OTP for {phone}: {otp}")
        
        return Response(
            {
                "message": "OTP sent successfully",
                "session_id": session_id,
                "debug_otp": otp if settings.DEBUG else None
            },
            status=status.HTTP_200_OK
        )


class PhoneSignupVerifyView(APIView):
    """
    Verify OTP and create user account for phone signup.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_id = request.data.get("session_id")
        otp = request.data.get("otp")
        password = request.data.get("password")
        
        if not all([session_id, otp, password]):
            return Response(
                {"error": "session_id, otp, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retrieve cached signup data
        cached_data = cache.get(f"phone_signup:{session_id}")
        
        if not cached_data:
            return Response(
                {"error": "OTP expired or session not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if cached_data["otp"] != otp:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        phone = cached_data["phone"]
        
        # Create new user
        try:
            user = User.objects.create_user(
                username=phone,
                email=f"{phone}@phone.local",
                password=password
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create account: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clear cache
        cache.delete(f"phone_signup:{session_id}")
        
        # Issue JWTs
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user_id": str(user.id)
            },
            status=status.HTTP_201_CREATED
        )


# ============================================================
# RECOVERY CODE LOGIN (12-digit recovery code authentication)
# ============================================================

class RecoveryCodeLoginSerializer(serializers.Serializer):
    """
    Serializer for login using 12-digit recovery code.
    User can set a new password after verification.
    """
    email = serializers.EmailField(help_text="User's primary email")
    recovery_code = serializers.CharField(
        max_length=12,
        min_length=12,
        help_text="12-digit recovery code"
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        help_text="New password (at least 8 characters)"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True
    )
    
    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return attrs


class RecoveryCodeLoginView(APIView):
    """
    Login using recovery code when user has lost email access.
    
    POST /api/auth/recovery-login/
    {
        "email": "user@example.com",
        "recovery_code": "123456789012",
        "new_password": "NewPassword123!",
        "confirm_password": "NewPassword123!"
    }
    
    Returns:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user_id": "user_id",
        "message": "Account recovered successfully"
    }
    """
    
    def post(self, request):
        serializer = RecoveryCodeLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        recovery_code = serializer.validated_data['recovery_code']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Import recovery models
        from core.models import AccountRecoveryCode
        
        # Hash the provided recovery code
        code_hash = AccountRecoveryCode.hash_code(recovery_code)
        
        try:
            # Find and validate recovery code
            recovery = AccountRecoveryCode.objects.get(
                user=user,
                code_hash=code_hash,
                is_used=False
            )
            
            # Mark code as used
            from django.utils import timezone
            recovery.is_used = True
            recovery.used_at = timezone.now()
            recovery.save()
            
            # Update user password
            user.set_password(new_password)
            user.save()
            
            # Issue JWTs
            refresh = RefreshToken.for_user(user)
            
            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user_id": str(user.id),
                    "message": "Account recovered successfully. Password has been updated."
                },
                status=status.HTTP_200_OK
            )
        
        except AccountRecoveryCode.DoesNotExist:
            return Response(
                {'error': 'Invalid or already used recovery code'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================
# PASSWORD RECOVERY ENDPOINTS (Forgot Password Flow)
# ============================================================

class PasswordRecoveryInitiateView(APIView):
    """
    Initiate password recovery process - accepts email OR mobile
    POST /api/auth/recover/initiate/
    
    Request:
        {
            "email": "user@example.com"  // optional
        }
        OR
        {
            "mobile": "+1234567890"      // optional
        }
        OR both - system will find user by either method
    
    Response:
        {
            "message": "Recovery code generated",
            "code": "123456789012",      // For testing - display this on frontend
            "expires_in_minutes": 30,
            "recovery_method": "email"   // or "mobile"
        }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from core.models import PasswordRecoveryCode
        from core.utils.email_service import EmailService
        
        email = request.data.get('email', '').strip().lower() if request.data.get('email') else None
        mobile = request.data.get('mobile', '').strip() if request.data.get('mobile') else None
        
        if not email and not mobile:
            return Response(
                {'error': 'Email or mobile number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find user by email OR mobile
        user = None
        recovery_method = None
        
        if email:
            try:
                user = User.objects.get(email=email)
                recovery_method = 'email'
            except User.DoesNotExist:
                pass
        
        # If not found by email, try mobile
        if not user and mobile:
            try:
                user = User.objects.get(profile__recovery_mobile=mobile)
                recovery_method = 'mobile'
                email = user.email  # Use their primary email
            except User.DoesNotExist:
                pass
        
        if not user:
            # Don't reveal if email/mobile exists (security)
            return Response(
                {'message': 'If an account with this email/mobile exists, recovery instructions have been sent'},
                status=status.HTTP_200_OK
            )
        
        # Check rate limiting (5 attempts per 24 hours)
        if PasswordRecoveryCode.get_rate_limit_exceeded(user, hours=24):
            return Response(
                {'error': 'Too many recovery attempts. Please try again in 24 hours.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        try:
            # Create recovery code
            recovery = PasswordRecoveryCode.create_for_user(user, email)
            
            # Send email with recovery code
            success = EmailService.send_password_reset_code(email, recovery.code, user.profile.username_display if hasattr(user, 'profile') else user.username)
            
            if not success:
                return Response(
                    {'error': 'Failed to send recovery email. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                {
                    'message': 'Recovery code generated successfully. Use code below to proceed.',
                    'code': recovery.code,           # Display on frontend for testing
                    'expires_in_minutes': 30,
                    'recovery_method': recovery_method
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Password recovery initiation error: {str(e)}")
            return Response(
                {'error': 'An error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordRecoveryVerifyIdentityView(APIView):
    """
    Verify user identity for password recovery
    POST /api/auth/recover/verify-identity/
    
    Request:
        {
            "email": "user@example.com",
            "username_display": "johndoe",
            "recovery_mobile": "+1234567890"
        }
    
    Response:
        {
            "message": "Identity verified",
            "can_proceed": true
        }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        username_display = request.data.get('username_display', '').strip()
        recovery_mobile = request.data.get('recovery_mobile', '').strip()
        
        if not email or not username_display or not recovery_mobile:
            return Response(
                {'error': 'Email, username, and mobile number are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            profile = user.profile
            
            # Verify all three match
            if (profile.username_display.lower() != username_display.lower() or
                profile.recovery_mobile != recovery_mobile):
                return Response(
                    {'error': 'Verification information does not match. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(
                {
                    'message': 'Identity verified successfully',
                    'can_proceed': True
                },
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Identity verification error: {str(e)}")
            return Response(
                {'error': 'Verification failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordRecoveryResetView(APIView):
    """
    Reset password using recovery code
    POST /api/auth/recover/reset-password/
    
    Request:
        {
            "email": "user@example.com",
            "code": "123456789012",
            "new_password": "newpassword123"
        }
    
    Response:
        {
            "message": "Password reset successfully",
            "access": "token...",
            "refresh": "token...",
            "recovery_contact": {
                "email": "recovery@example.com",
                "mobile": "+1234567890"
            }
        }
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from core.models import PasswordRecoveryCode
        
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '')
        
        if not email or not code or not new_password:
            return Response(
                {'error': 'Email, recovery code, and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find recovery code
            recovery = PasswordRecoveryCode.objects.get(email=email, code=code)
            
            # Check validity
            if not recovery.is_valid():
                if recovery.is_expired():
                    error_msg = 'Recovery code has expired. Please request a new one.'
                elif recovery.is_used:
                    error_msg = 'Recovery code has already been used.'
                else:
                    error_msg = 'Too many failed attempts. Please request a new code.'
                
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user and update password
            user = recovery.user
            user.set_password(new_password)
            user.save()
            
            # Mark recovery code as used
            recovery.is_used = True
            recovery.used_at = timezone.now()
            recovery.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response(
                {
                    'message': 'Password reset successfully. You can now login with your new password.',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'recovery_contact': {
                        'email': user.profile.recovery_email or 'Not set',
                        'mobile': user.profile.recovery_mobile or 'Not set'
                    }
                },
                status=status.HTTP_200_OK
            )
            
        except PasswordRecoveryCode.DoesNotExist:
            recovery = PasswordRecoveryCode.objects.filter(email=email).first()
            if recovery:
                recovery.attempts += 1
                recovery.save()
            
            return Response(
                {'error': 'Invalid recovery code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return Response(
                {'error': 'Password reset failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
