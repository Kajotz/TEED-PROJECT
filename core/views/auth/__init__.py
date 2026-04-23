from .auth import (
    GoogleAuthView,
    FacebookAuthView,
    EmailTokenObtainPairView,
    PhoneOTPLoginView,
    PhoneOTPVerifyView,
    PhoneSignupView,
    PhoneSignupVerifyView,
    hello,
    test_api,
)

from .recovery import (
    RecoveryCodeLoginView,
    PasswordRecoveryInitiateView,
    PasswordRecoveryVerifyIdentityView,
    PasswordRecoveryResetView,
)

from .registration import CustomRegisterView

from .email_verification import (
    EmailVerificationView,
    AccountRecoveryView,
    RecoveryContactView,
    DebugVerificationView,
)

from .post_auth_state import PostAuthStateView

__all__ = [
    # auth.py
    "GoogleAuthView",
    "FacebookAuthView",
    "EmailTokenObtainPairView",
    "PhoneOTPLoginView",
    "PhoneOTPVerifyView",
    "PhoneSignupView",
    "PhoneSignupVerifyView",
    "hello",
    "test_api",

    # recovery.py
    "RecoveryCodeLoginView",
    "PasswordRecoveryInitiateView",
    "PasswordRecoveryVerifyIdentityView",
    "PasswordRecoveryResetView",

    # registration.py
    "CustomRegisterView",

    # email_verification.py
    "EmailVerificationView",
    "AccountRecoveryView",
    "RecoveryContactView",
    "DebugVerificationView",

    # post_auth_state.py
    "PostAuthStateView",
]