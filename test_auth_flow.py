#!/usr/bin/env python
"""
Test script to verify authentication flow:
1. Test email/password login
2. Test token retrieval
3. Test user endpoint with token
"""
import os
import sys
import json
import django
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teedhub_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

# Create test client
client = APIClient()

print("=" * 60)
print("AUTHENTICATION FLOW TEST")
print("=" * 60)

# 1. Create a test user if it doesn't exist
test_email = "testuser@example.com"
test_password = "TestPassword123!"

try:
    user = User.objects.get(email=test_email)
    print(f"✓ Test user exists: {test_email}")
except User.DoesNotExist:
    user = User.objects.create_user(
        email=test_email,
        username=test_email.split("@")[0],
        password=test_password
    )
    print(f"✓ Created test user: {test_email}")

# 2. Test login with email and password
print("\n1. Testing Email/Password Login...")
login_response = client.post(
    "/api/auth/token/",
    {"email": test_email, "password": test_password},
    format="json"
)

print(f"   Status: {login_response.status_code}")
if login_response.status_code == 200:
    data = login_response.json()
    print("   ✓ Login successful!")
    print(f"   - Has 'access' token: {'access' in data}")
    print(f"   - Has 'refresh' token: {'refresh' in data}")
    access_token = data.get('access')
    refresh_token = data.get('refresh')
else:
    print(f"   ✗ Login failed!")
    print(f"   Response: {login_response.json()}")
    sys.exit(1)

# 3. Test user endpoint with token
print("\n2. Testing User Endpoint with Token...")
user_response = client.get(
    "/dj-rest-auth/user/",
    HTTP_AUTHORIZATION=f"Bearer {access_token}"
)

print(f"   Status: {user_response.status_code}")
if user_response.status_code == 200:
    user_data = user_response.json()
    print("   ✓ User endpoint works!")
    print(f"   - Email: {user_data.get('email')}")
    print(f"   - Username: {user_data.get('username')}")
else:
    print(f"   ✗ User endpoint failed!")
    print(f"   Response: {user_response.json()}")

# 4. Test registration
print("\n3. Testing Registration (Signup)...")
new_email = f"newuser+{uuid.uuid4().hex[:8]}@example.com"
new_password = "NewPassword123!"

signup_response = client.post(
    "/dj-rest-auth/registration/",
    {
        "email": new_email,
        "password1": new_password,
        "password2": new_password,
    },
    format="json"
)

print(f"   Status: {signup_response.status_code}")
if signup_response.status_code == 201:
    data = signup_response.json()
    print("   ✓ Registration successful!")
    print(f"   - Has 'access' token: {'access' in data}")
    print(f"   - Has 'refresh' token: {'refresh' in data}")
    print(f"   - Has 'user' data: {'user' in data}")
else:
    print(f"   ✗ Registration failed!")
    print(f"   Response: {signup_response.json()}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
