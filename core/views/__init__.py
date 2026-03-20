from .auth import GoogleAuthView
from .test_views import hello, test_api

# Auth Views
from .auth import (
    EmailTokenObtainPairView,
    PhoneOTPLoginView,
    PhoneOTPVerifyView,
    PhoneSignupView,
    PhoneSignupVerifyView,
    RecoveryCodeLoginView,
    PasswordRecoveryInitiateView,
    PasswordRecoveryVerifyIdentityView,
    PasswordRecoveryResetView,
    CustomRegisterView,
    SocialAuthCallbackView,
    SocialAuthErrorView,
    EmailVerificationView,
    AccountRecoveryView,
    RecoveryContactView,
    DebugVerificationView,
)

# Profile Views
from .profile import (
    UserProfileView,
    UserBusinessesListView,
    BusinessDetailFromUserView,
    PersonalInfoViewSet,
    SocialAccountViewSet,
)

# Business Views
from .business import (
    BusinessCreateView,
    BusinessListView,
    BusinessDetailView,
    BusinessProfileUpdateView,
    MembershipUpdateView,
    BusinessSettingsView,
    BusinessProfileAPIView,
    SwitchActiveBusinessView,
)

__all__ = [
    # Test views
    "hello",
    "test_api",
    # Auth views
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
    "CustomRegisterView",
    "SocialAuthCallbackView",
    "SocialAuthErrorView",
    "EmailVerificationView",
    "AccountRecoveryView",
    "RecoveryContactView",
    "DebugVerificationView",
    # Profile views
    "UserProfileView",
    "UserBusinessesListView",
    "BusinessDetailFromUserView",
    "PersonalInfoViewSet",
    "SocialAccountViewSet",
    # Business views
    "BusinessCreateView",
    "BusinessListView",
    "BusinessDetailView",
    "BusinessProfileUpdateView",
    "MembershipUpdateView",
    "BusinessSettingsView",
    "BusinessProfileAPIView",
    "SwitchActiveBusinessView",
]
