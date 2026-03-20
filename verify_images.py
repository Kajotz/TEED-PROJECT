#!/usr/bin/env python
"""Quick test to verify profile image serialization"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teedhub_backend.settings')
django.setup()

from django.test import RequestFactory
from core.models import UserProfile
from core.serializers import PersonalInfoSerializer

# Create a test request
factory = RequestFactory()
request = factory.get('/', SERVER_NAME='127.0.0.1', SERVER_PORT='8000')

# Get a profile with an image
profiles = UserProfile.objects.filter(profile_image__isnull=False)
print(f"Found {profiles.count()} profiles with images\n")

for profile in profiles[:3]:
    serializer = PersonalInfoSerializer(profile, context={'request': request})
    data = serializer.data
    
    print("=" * 70)
    print(f"User: {data['username']}")
    print(f"Profile Image URL: {data['profile_image']}")
    print()
    
    # Check if file exists
    if profile.profile_image:
        file_path = profile.profile_image.path
        exists = os.path.exists(file_path)
        print(f"Physical file path: {file_path}")
        print(f"File exists: {exists}")
        print()
