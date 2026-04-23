from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.views import APIView


class RootView(APIView):
    def get(self, request):
        return Response({
            "message": "TEED Hub Backend API",
            "endpoints": {
                "admin": "/admin/",
                "api": "/api/",
            }
        })


urlpatterns = [
    path("", RootView.as_view()),
    path("admin/", admin.site.urls),

    # Main API (your structured modules: auth, profile, business, rbac, sales)
    path("api/", include("core.api_urls")),
]


# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)