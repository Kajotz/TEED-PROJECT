from django.http import JsonResponse, HttpResponseRedirect
from django.views import View
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings


class SocialAuthCallbackView(View):
    """
    Handle allauth social auth callback and redirect to frontend with tokens.
    """
    
    def get(self, request):
        # Check if user is authenticated
        if request.user and not isinstance(request.user, AnonymousUser):
            # Generate JWT tokens for the authenticated user
            refresh = RefreshToken.for_user(request.user)
            
            # Build frontend URL with tokens as query parameters
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            redirect_url = f"{frontend_url}/dashboard?access_token={str(refresh.access_token)}&refresh_token={str(refresh)}"
            
            return HttpResponseRedirect(redirect_url)
        else:
            # User not authenticated, redirect to login
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            return HttpResponseRedirect(f"{frontend_url}/login?error=auth_failed")


class SocialAuthErrorView(View):
    """
    Handle allauth social auth errors.
    """
    
    def get(self, request):
        error = request.GET.get('error', 'Unknown error')
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return HttpResponseRedirect(f"{frontend_url}/login?error={error}")
