from django.urls import path

from core.views.business import (
    BusinessCreateView,
    BusinessDetailView,
    BusinessListView,
    BusinessProfileAPIView,
    BusinessSettingsView,
    SwitchActiveBusinessView,
)

urlpatterns = [
    path("businesses/", BusinessListView.as_view(), name="business-list"),
    path("businesses/create/", BusinessCreateView.as_view(), name="business-create"),
    path(
        "businesses/<uuid:business_id>/activate/",
        SwitchActiveBusinessView.as_view(),
        name="switch_active_business",
    ),
    path("businesses/<uuid:business_id>/", BusinessDetailView.as_view(), name="business-detail"),
    path(
        "businesses/<uuid:business_id>/profile/",
        BusinessProfileAPIView.as_view(),
        name="business-profile",
    ),
    path(
        "businesses/<uuid:business_id>/settings/",
        BusinessSettingsView.as_view(),
        name="business-settings",
    ),
]