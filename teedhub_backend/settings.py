import os
from pathlib import Path
from datetime import timedelta
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY", default="django-insecure-your-secret-key-here")
DEBUG = env.bool("DEBUG", default=True)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "testserver"])

REST_USE_JWT = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # Allauth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.facebook",
    "allauth.socialaccount.providers.apple",

    # Third-party
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "corsheaders",
    "dj_rest_auth",
    "dj_rest_auth.registration",

    # Local apps
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "teedhub_backend.middleware.CSRFExemptAPIMiddleware",
    "teedhub_backend.middleware.CORPHeaderMiddleware",
]

ROOT_URLCONF = "teedhub_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "teedhub_backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("en", "English"),
    ("sw", "Kiswahili"),
]

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "profile_images")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SITE_ID = 1

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
)

CORS_ALLOW_CREDENTIALS = True

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
}

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "APP": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
            "secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
            "key": "",
        },
        "SCOPE": [
            "profile",
            "email",
        ],
        "AUTH_PARAMS": {
            "access_type": "online",
        },
    },
    "facebook": {
        "APP": {
            "client_id": os.getenv("FACEBOOK_CLIENT_ID", ""),
            "secret": os.getenv("FACEBOOK_CLIENT_SECRET", ""),
            "key": "",
        },
        "METHOD": "oauth2",
        "SCOPE": [
            "email",
            "public_profile",
        ],
        "VERIFIED_EMAIL": False,
    },
    "apple": {
        "APP": {
            "client_id": os.getenv("APPLE_CLIENT_ID", "com.example.teedhub"),
            "secret": os.getenv("APPLE_SECRET", ""),
            "key": os.getenv("APPLE_KEY_ID", ""),
        },
        "SCOPE": [
            "email",
            "name",
        ],
        "AUTH_PARAMS": {
            "response_type": "code id_token",
            "response_mode": "form_post",
        },
        "SETTINGS": {
            "VERIFIED_EMAIL": True,
            "APP_ID": os.getenv("APPLE_APP_ID", "com.example.teedhub"),
            "TEAM_ID": os.getenv("APPLE_TEAM_ID", ""),
            "KEY_ID": os.getenv("APPLE_KEY_ID", ""),
        },
    },
}

IS_MOBILE_API = env.bool("IS_MOBILE_API", default=False)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "BLACKLIST_AFTER_ROTATION": True,
    "ROTATE_REFRESH_TOKENS": True,
}

REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_RETURN_EXPIRATION": True,
    "JWT_AUTH_HTTPONLY": not IS_MOBILE_API,
    "OLD_PASSWORD_FIELD_ENABLED": True,
    "SESSION_LOGIN": False,
}

if IS_MOBILE_API:
    REST_AUTH.update({
        "JWT_AUTH_COOKIE": None,
        "JWT_AUTH_REFRESH_COOKIE": None,
    })
else:
    REST_AUTH.update({
        "JWT_AUTH_COOKIE": "access_token",
        "JWT_AUTH_REFRESH_COOKIE": "refresh_token",
    })

ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_CONFIRM_EMAIL_ON_GET = False

ACCOUNT_RATE_LIMITS = {
    "login_failed": "5/5m",
}

EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend"
)

GMAIL_HOST = "smtp.gmail.com"
GMAIL_PORT = 587
GMAIL_USE_TLS = True

APPLE_HOST = "smtp.mail.icloud.com"
APPLE_PORT = 587
APPLE_USE_TLS = True

SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")
MAILGUN_API_KEY = env("MAILGUN_API_KEY", default="")
MAILGUN_DOMAIN = env("MAILGUN_DOMAIN", default="")

EMAIL_PROVIDER = env("EMAIL_PROVIDER", default="console")

if EMAIL_PROVIDER == "gmail":
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = GMAIL_HOST
    EMAIL_PORT = GMAIL_PORT
    EMAIL_USE_TLS = GMAIL_USE_TLS
    EMAIL_HOST_USER = env("GMAIL_EMAIL", default="")
    EMAIL_HOST_PASSWORD = env("GMAIL_APP_PASSWORD", default="")

elif EMAIL_PROVIDER == "apple":
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = APPLE_HOST
    EMAIL_PORT = APPLE_PORT
    EMAIL_USE_TLS = APPLE_USE_TLS
    EMAIL_HOST_USER = env("APPLE_EMAIL", default="")
    EMAIL_HOST_PASSWORD = env("APPLE_APP_PASSWORD", default="")

elif EMAIL_PROVIDER == "sendgrid":
    EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"
    SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")

elif EMAIL_PROVIDER == "mailgun":
    EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
    ANYMAIL = {
        "MAILGUN_API_KEY": env("MAILGUN_API_KEY", default=""),
    }

else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@teedhub.app")

EMAIL_VERIFICATION_TIMEOUT = env.int("EMAIL_VERIFICATION_TIMEOUT", default=24)
MAX_VERIFICATION_ATTEMPTS = env.int("MAX_VERIFICATION_ATTEMPTS", default=5)
MAX_RECOVERY_ATTEMPTS = env.int("MAX_RECOVERY_ATTEMPTS", default=5)

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")