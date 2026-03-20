#!/usr/bin/env python
"""Check database for existing profile images"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teedhub_backend.settings')
django.setup()

from core.models import UserProfile

print("=" * 70)
print("UserProfile Database Records")
print("=" * 70)

profiles = UserProfile.objects.all()
print(f"Total profiles: {profiles.count()}\n")

for profile in profiles:
    print(f"User: {profile.user.username}")
    print(f"  Display Name: {profile.username_display}")
    print(f"  Profile Image: {profile.profile_image}")
    print(f"  Image URL: {profile.profile_image.url if profile.profile_image else 'None'}")
    print()
