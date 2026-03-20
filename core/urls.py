from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import hello, test_api, GoogleAuthView
from core.views.auth import (
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
from core.views.profile import (
    UserProfileView,
    UserBusinessesListView,
    BusinessDetailFromUserView,
    PersonalInfoViewSet,
    SocialAccountViewSet,
)
from core.views.business import (
    BusinessCreateView,
    BusinessListView,
    BusinessDetailView,
    BusinessProfileUpdateView,
    MembershipUpdateView,
    BusinessSettingsView,
    BusinessProfileAPIView,
    SwitchActiveBusinessView,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'personal-info', PersonalInfoViewSet, basename='personal-info')
router.register(r'social-accounts', SocialAccountViewSet, basename='social-account')

urlpatterns = [
    path("hello/", hello),
    path("test/", test_api),

    # Email/Password Auth (JWT) - Custom view that accepts email instead of username
    path("auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Social Auth (Google via dj-rest-auth or custom)
    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
    
    # Phone OTP Login/Verification
    path("auth/phone/login/", PhoneOTPLoginView.as_view(), name="phone_otp_login"),
    path("auth/phone/verify/", PhoneOTPVerifyView.as_view(), name="phone_otp_verify"),

    # Phone OTP Signup/Verification
    path("auth/phone/signup/", PhoneSignupView.as_view(), name="phone_signup"),
    path("auth/phone/signup/verify/", PhoneSignupVerifyView.as_view(), name="phone_signup_verify"),

    # User Profile Management
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("profile/businesses/", UserBusinessesListView.as_view(), name="user_businesses"),
    path("profile/businesses/<uuid:business_id>/", BusinessDetailFromUserView.as_view(), name="business_detail_from_user"),
   
    # Email Verification & Account Recovery
    path("auth/email-verification/", EmailVerificationView.as_view(), name="email_verification"),
    path("auth/email-verification/debug/", DebugVerificationView.as_view(), name="debug_verification"),
    path("auth/account-recovery/", AccountRecoveryView.as_view(), name="account_recovery"),
    path("auth/recovery-contacts/", RecoveryContactView.as_view(), name="recovery_contacts"),
    path("auth/recovery-contacts/<uuid:contact_id>/", RecoveryContactView.as_view(), name="recovery_contact_detail"),
    path("auth/recovery-login/", RecoveryCodeLoginView.as_view(), name="recovery_code_login"),
    
    # Password Recovery (Forgot Password Flow)
    path("auth/recover/initiate/", PasswordRecoveryInitiateView.as_view(), name="password_recovery_initiate"),
    path("auth/recover/verify-identity/", PasswordRecoveryVerifyIdentityView.as_view(), name="password_recovery_verify_identity"),
    path("auth/recover/reset-password/", PasswordRecoveryResetView.as_view(), name="password_recovery_reset"),

    path('businesses/', BusinessListView.as_view(), name='business-list'),
    path('businesses/create/', BusinessCreateView.as_view(), name='business-create'),
    path("businesses/<uuid:business_id>/activate/", SwitchActiveBusinessView.as_view(), name="switch_active_business"),
    path('businesses/<uuid:business_id>/', BusinessDetailView.as_view(), name='business-detail'),
    path('businesses/<uuid:business_id>/profile/', BusinessProfileAPIView.as_view(), name='business-profile'),
    path('businesses/<uuid:business_id>/settings/', BusinessSettingsView.as_view(), name='business-settings'),
    path('businesses/<uuid:business_id>/members/<int:user_id>/', MembershipUpdateView.as_view(), name='membership-update'),
] + router.urls

