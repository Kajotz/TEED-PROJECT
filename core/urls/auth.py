from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from core.views import FacebookAuthView, GoogleAuthView
from core.views.auth import (
    AccountRecoveryView,
    CustomRegisterView,
    DebugVerificationView,
    EmailTokenObtainPairView,
    EmailVerificationView,
    PasswordRecoveryInitiateView,
    PasswordRecoveryResetView,
    PasswordRecoveryVerifyIdentityView,
    PhoneOTPLoginView,
    PhoneOTPVerifyView,
    PhoneSignupVerifyView,
    PhoneSignupView,
    RecoveryCodeLoginView,
    RecoveryContactView,
)
from core.views.auth.post_auth_state import PostAuthStateView
from core.views.auth.recovery import (
    AddRecoveryMethodView,
    CompleteAccountRecoveryView,
    DeactivateRecoveryMethodView,
    InitiateAccountRecoveryView,
    RecoveryLookupView,
    RecoveryMethodListView,
    SetDefaultRecoveryMethodView,
    VerifyAccountRecoveryView,
    VerifyRecoveryMethodView,
)
from core.views.profile.account_completion import AccountCompletionView

urlpatterns = [
    # JWT auth
    path("auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Social auth
    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
    path("auth/facebook/", FacebookAuthView.as_view(), name="facebook_auth"),

    # Phone OTP login
    path("auth/phone/login/", PhoneOTPLoginView.as_view(), name="phone_otp_login"),
    path("auth/phone/verify/", PhoneOTPVerifyView.as_view(), name="phone_otp_verify"),

    # Phone signup
    path("auth/phone/signup/", PhoneSignupView.as_view(), name="phone_signup"),
    path("auth/phone/signup/verify/", PhoneSignupVerifyView.as_view(), name="phone_signup_verify"),

    # Registration / post auth
    path("auth/register/", CustomRegisterView.as_view(), name="custom_register"),
    path("auth/post-auth-state/", PostAuthStateView.as_view(), name="post_auth_state"),
    path("account/completion/", AccountCompletionView.as_view(), name="account_completion"),

    # Email verification & legacy recovery
    path("auth/email-verification/", EmailVerificationView.as_view(), name="email_verification"),
    path("auth/email-verification/debug/", DebugVerificationView.as_view(), name="debug_verification"),
    path("auth/account-recovery/", AccountRecoveryView.as_view(), name="account_recovery"),
    path("auth/recovery-contacts/", RecoveryContactView.as_view(), name="recovery_contacts"),
    path(
        "auth/recovery-contacts/<uuid:contact_id>/",
        RecoveryContactView.as_view(),
        name="recovery_contact_detail",
    ),
    path("auth/recovery-login/", RecoveryCodeLoginView.as_view(), name="recovery_code_login"),

    # Password recovery
    path(
        "auth/recover/initiate/",
        PasswordRecoveryInitiateView.as_view(),
        name="password_recovery_initiate",
    ),
    path(
        "auth/recover/verify-identity/",
        PasswordRecoveryVerifyIdentityView.as_view(),
        name="password_recovery_verify_identity",
    ),
    path(
        "auth/recover/reset-password/",
        PasswordRecoveryResetView.as_view(),
        name="password_recovery_reset",
    ),

    # New account recovery methods
    path("recovery/methods/", RecoveryMethodListView.as_view(), name="recovery-method-list"),
    path("recovery/methods/add/", AddRecoveryMethodView.as_view(), name="recovery-method-add"),
    path("recovery/methods/verify/", VerifyRecoveryMethodView.as_view(), name="recovery-method-verify"),
    path(
        "recovery/methods/set-default/",
        SetDefaultRecoveryMethodView.as_view(),
        name="recovery-method-set-default",
    ),
    path(
        "recovery/methods/<uuid:method_id>/deactivate/",
        DeactivateRecoveryMethodView.as_view(),
        name="recovery-method-deactivate",
    ),

    # New account recovery auth flow
    path("auth/recovery/lookup/", RecoveryLookupView.as_view(), name="auth-recovery-lookup"),
    path("auth/recovery/initiate/", InitiateAccountRecoveryView.as_view(), name="auth-recovery-initiate"),
    path("auth/recovery/verify/", VerifyAccountRecoveryView.as_view(), name="auth-recovery-verify"),
    path("auth/recovery/complete/", CompleteAccountRecoveryView.as_view(), name="auth-recovery-complete"),
]