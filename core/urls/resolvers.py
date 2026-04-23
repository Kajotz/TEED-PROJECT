from django.urls import path

from core.views.resolvers.business_search import BusinessSearchView
from core.views.resolvers.user_search import UserSearchView

urlpatterns = [
    path("users/search/", UserSearchView.as_view(), name="user-search"),
    path("businesses/search/", BusinessSearchView.as_view(), name="business-search"),
]