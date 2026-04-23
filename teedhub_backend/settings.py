import os
from pathlib import Path
from datetime import timedelta

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("SECRET_KEY", default="django-insecure-your-secret-key-here")
DEBUG = env.bool("DEBUG", default=True)

ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS",
    default=[
        "localhost",
        "127.0.0.1",
        "testserver",
    ],
)

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
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    # Local apps
    "core.apps.CoreConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
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
AUTH_USER_MODEL = "core.User"
SITE_ID = 1

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

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
            "client_id": env("GOOGLE_CLIENT_ID", default=""),
            "secret": env("GOOGLE_CLIENT_SECRET", default=""),
            "key": "",
        },
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {
            "access_type": "online",
        },
    },
    "facebook": {
        "APP": {
            "client_id": env("FACEBOOK_CLIENT_ID", default=""),
            "secret": env("FACEBOOK_CLIENT_SECRET", default=""),
            "key": "",
        },
        "METHOD": "oauth2",
        "SCOPE": ["email", "public_profile"],
        "VERIFIED_EMAIL": False,
    },
    "apple": {
        "APP": {
            "client_id": env("APPLE_CLIENT_ID", default="com.example.teedhub"),
            "secret": env("APPLE_SECRET", default=""),
            "key": env("APPLE_KEY_ID", default=""),
        },
        "SCOPE": ["email", "name"],
        "AUTH_PARAMS": {
            "response_type": "code id_token",
            "response_mode": "form_post",
        },
        "SETTINGS": {
            "VERIFIED_EMAIL": True,
            "APP_ID": env("APPLE_APP_ID", default="com.example.teedhub"),
            "TEAM_ID": env("APPLE_TEAM_ID", default=""),
            "KEY_ID": env("APPLE_KEY_ID", default=""),
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
    REST_AUTH.update(
        {
            "JWT_AUTH_COOKIE": None,
            "JWT_AUTH_REFRESH_COOKIE": None,
        }
    )
else:
    REST_AUTH.update(
        {
            "JWT_AUTH_COOKIE": "access_token",
            "JWT_AUTH_REFRESH_COOKIE": "refresh_token",
        }
    )

ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_CONFIRM_EMAIL_ON_GET = False

ACCOUNT_RATE_LIMITS = {
    "login_failed": "5/5m",
}

# =========================
# EMAIL CONFIG - BREVO SMTP
# =========================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp-relay.brevo.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=10)

# Brevo SMTP login + key
EMAIL_HOST_USER = env("BREVO_SMTP_LOGIN", default="a7338f001@smtp-brevo.com")
EMAIL_HOST_PASSWORD = env("BREVO_SMTP_KEY", default="")

# Sender must be verified in Brevo
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Renatusmm@gmail.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
EMAIL_SUBJECT_PREFIX = env("EMAIL_SUBJECT_PREFIX", default="[TeedHub] ")

# Verification / recovery config
EMAIL_VERIFICATION_TIMEOUT = env.int("EMAIL_VERIFICATION_TIMEOUT", default=10)
MAX_VERIFICATION_ATTEMPTS = env.int("MAX_VERIFICATION_ATTEMPTS", default=5)
MAX_RECOVERY_ATTEMPTS = env.int("MAX_RECOVERY_ATTEMPTS", default=5)

# Phone OTP config
PHONE_OTP_TIMEOUT = env.int("PHONE_OTP_TIMEOUT", default=600)
PHONE_OTP_LENGTH = env.int("PHONE_OTP_LENGTH", default=6)
PHONE_OTP_MAX_ATTEMPTS = env.int("PHONE_OTP_MAX_ATTEMPTS", default=5)

# Brevo SMS config
BREVO_API_KEY = env("BREVO_API_KEY", default="")
USE_BREVO_SMS = env.bool("USE_BREVO_SMS", default=False)
BREVO_SMS_SENDER = env("BREVO_SMS_SENDER", default="TeedHub")
BREVO_SMS_TIMEOUT = env.int("BREVO_SMS_TIMEOUT", default=10)

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")