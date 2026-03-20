#!/usr/bin/env python
"""Test script to verify profile image serialization"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teedhub_backend.settings')
django.setup()

from django.test import RequestFactory
from core.models import UserProfile
from core.serializers import PersonalInfoSerializer
from django.contrib.auth.models import User

# Create a test request
factory = RequestFactory()
request = factory.get('/')

# Get or create a test user
user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})

# Get or create profile
profile, _ = UserProfile.objects.get_or_create(
    user=user,
    defaults={'username_display': 'Test User'}
)

# Serialize with request context
serializer = PersonalInfoSerializer(profile, context={'request': request})
data = serializer.data

print("=" * 60)
print("Profile Serialization Test")
print("=" * 60)
print(f"User: {user.username}")
print(f"Profile ID: {profile.id}")
print(f"Profile Image Field: {profile.profile_image}")
print(f"Profile Image Name: {profile.profile_image.name if profile.profile_image else 'None'}")
print()
print("Serialized Data:")
print("-" * 60)
import json
print(json.dumps(data, indent=2, default=str))
print()
print(f"Media Root: {os.path.join(os.path.dirname(__file__), 'media')}")
print(f"Media exists: {os.path.exists(os.path.join(os.path.dirname(__file__), 'media'))}")
