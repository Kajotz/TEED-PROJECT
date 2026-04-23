from django.urls import include, path

from core.views import hello, test_api

urlpatterns = [
    path("hello/", hello),
    path("test/", test_api),

    path("", include("core.urls.auth")),
    path("", include("core.urls.profile")),
    path("", include("core.urls.business")),
    path("", include("core.urls.rbac")),
    path("", include("core.urls.resolvers")),
    path("", include("core.urls.sales")),
]