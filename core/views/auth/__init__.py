from .auth import (
    GoogleAuthView,
    EmailTokenObtainPairView,
    PhoneOTPLoginView,
    PhoneOTPVerifyView,
    PhoneSignupView,
    PhoneSignupVerifyView,
    RecoveryCodeLoginView,
    PasswordRecoveryInitiateView,
    PasswordRecoveryVerifyIdentityView,
    PasswordRecoveryResetView,
)
from .registration import CustomRegisterView
from .auth_redirect import SocialAuthCallbackView, SocialAuthErrorView
from .email_verification import (
    EmailVerificationView,
    AccountRecoveryView,
    RecoveryContactView,
    DebugVerificationView,
)

__all__ = [
    # auth.py
    "GoogleAuthView",
    "EmailTokenObtainPairView",
    "PhoneOTPLoginView",
    "PhoneOTPVerifyView",
    "PhoneSignupView",
    "PhoneSignupVerifyView",
    "RecoveryCodeLoginView",
    "PasswordRecoveryInitiateView",
    "PasswordRecoveryVerifyIdentityView",
    "PasswordRecoveryResetView",
    # registration.py
    "CustomRegisterView",
    # auth_redirect.py
    "SocialAuthCallbackView",
    "SocialAuthErrorView",
    # email_verification.py
    "EmailVerificationView",
    "AccountRecoveryView",
    "RecoveryContactView",
    "DebugVerificationView",
]
