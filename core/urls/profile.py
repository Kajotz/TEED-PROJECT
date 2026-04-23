from rest_framework.routers import DefaultRouter
from core.views.profile import (
    BusinessDetailFromUserView,
    PersonalInfoViewSet,
    SocialAccountViewSet,
    UserBusinessesListView,
    UserProfileView,
)
from django.urls import path

router = DefaultRouter()
router.register(r"personal-info", PersonalInfoViewSet, basename="personal-info")
router.register(r"social-accounts", SocialAccountViewSet, basename="social-account")

urlpatterns = [
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("profile/businesses/", UserBusinessesListView.as_view(), name="user_businesses"),
    path(
        "profile/businesses/<uuid:business_id>/",
        BusinessDetailFromUserView.as_view(),
        name="business_detail_from_user",
    ),
] + router.urls