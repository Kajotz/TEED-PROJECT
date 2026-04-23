# Auth views
from .auth import (
    GoogleAuthView,
    FacebookAuthView,
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
    EmailVerificationView,
    AccountRecoveryView,
    RecoveryContactView,
    DebugVerificationView,
    PostAuthStateView,
    hello,
    test_api,
)

# Profile views
from .profile import (
    UserProfileView,
    UserBusinessesListView,
    BusinessDetailFromUserView,
    PersonalInfoViewSet,
    SocialAccountViewSet,
    AccountCompletionView,
)

# Business views
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

#sales views

from core.views.sales.inventory import (
    InventorySummaryView,
    ProductDetailView,
    ProductListCreateView,
    ProductStockAdjustmentListView,
    ProductUnitDetailView,
    ProductUnitListCreateView,
    StockAdjustmentCreateView,
)

__all__ = [
    # test
    "hello",
    "test_api",

    # auth
    "GoogleAuthView",
    "FacebookAuthView",
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
    "EmailVerificationView",
    "AccountRecoveryView",
    "RecoveryContactView",
    "DebugVerificationView",
    "PostAuthStateView",

    # profile
    "UserProfileView",
    "UserBusinessesListView",
    "BusinessDetailFromUserView",
    "PersonalInfoViewSet",
    "SocialAccountViewSet",
    "AccountCompletionView",

    # business
    "BusinessCreateView",
    "BusinessListView",
    "BusinessDetailView",
    "BusinessProfileUpdateView",
    "MembershipUpdateView",
    "BusinessSettingsView",
    "BusinessProfileAPIView",
    "SwitchActiveBusinessView",

#sales views
    "InventorySummaryView",
    "ProductDetailView",
    "ProductListCreateView",
    "ProductStockAdjustmentListView",
    "ProductUnitDetailView",
    "ProductUnitListCreateView",
    "StockAdjustmentCreateView",

]