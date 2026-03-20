from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.response import Response
from rest_framework.views import APIView
from core.views.auth.auth_redirect import SocialAuthCallbackView
from core.views.auth.registration import CustomRegisterView


class RootView(APIView):
    def get(self, request):
        return Response({
            "message": "TEED Hub Backend API",
            "endpoints": {
                "admin": "/admin/",
                "api": "/api/",
                "auth": "/dj-rest-auth/",
                "registration": "/dj-rest-auth/registration/"
            }
        })


urlpatterns = [
    path("", RootView.as_view()),
    path("admin/", admin.site.urls),

    # Core API
    path("api/", include("core.urls")),

    # Social Auth Callback (allauth redirect after OAuth)
    path("accounts/profile/", SocialAuthCallbackView.as_view(), name="social_auth_callback"),

    # Auth frameworks
    path("accounts/", include("allauth.urls")),
    path("dj-rest-auth/", include("dj_rest_auth.urls")),
    
    # Custom registration that returns tokens
    path("dj-rest-auth/registration/", CustomRegisterView.as_view(), name="custom_register"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


