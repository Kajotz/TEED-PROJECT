import re
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin


class CSRFExemptAPIMiddleware(MiddlewareMixin):
    """
    Custom middleware to exempt API endpoints from CSRF protection
    since they use JWT authentication instead.
    """
    exempt_patterns = [
        r'^/api/',
        r'^/dj-rest-auth/',
    ]
    
    def process_request(self, request):
        # Check if the request path matches any exempt pattern
        for pattern in self.exempt_patterns:
            if re.match(pattern, request.path):
                # Mark the request as CSRF exempt
                request._dont_enforce_csrf_checks = True
                break
        return None


class CORPHeaderMiddleware(MiddlewareMixin):
    """
    Middleware to set Cross-Origin-Opener-Policy header.
    Uses 'same-origin-allow-popups' to allow Google OAuth iframe communication
    while maintaining security.
    """
    def process_response(self, request, response):
        # Set COOP header to allow popups (needed for Google OAuth)
        response['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
        return response
